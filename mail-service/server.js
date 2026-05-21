// Recebedor SMTP de entrada (só recebe) para *@*.<MAIL_ROOT_DOMAIN>.
// Parseia o email e faz POST autenticado para o webhook do app.
const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");

const ROOT = (process.env.MAIL_ROOT_DOMAIN || "vertentebr.com.br").toLowerCase();
const WEBHOOK = process.env.MAIL_WEBHOOK_URL;
const SECRET = process.env.MAIL_INBOUND_SECRET || "";
const PORT = Number(process.env.SMTP_PORT || 25);
const MAX_SIZE = Number(process.env.MAIL_MAX_SIZE || 5 * 1024 * 1024);

if (!WEBHOOK || !SECRET) {
  console.error("faltam MAIL_WEBHOOK_URL e/ou MAIL_INBOUND_SECRET");
  process.exit(1);
}

// Só aceitamos destinatários de subdomínios do nosso root: local@<sub>.<root>
function aceita(addr) {
  const host = String(addr || "").toLowerCase().split("@")[1];
  if (!host) return false;
  return host.endsWith(`.${ROOT}`) && host !== ROOT;
}

async function entregar(payload) {
  try {
    const r = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mail-token": SECRET },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) console.error("webhook nao-ok", r.status, payload.to);
  } catch (e) {
    console.error("webhook falhou", e?.message, payload.to);
  }
}

const server = new SMTPServer({
  // STARTTLS desabilitado: a impl. de TLS trava sob bun (handshake timeout).
  // Sem STARTTLS, remetentes entregam em texto puro (Gmail/Outlook fazem isso).
  hideSTARTTLS: true,
  authOptional: true,
  disabledCommands: ["AUTH"],
  size: MAX_SIZE,
  banner: "vertente-mail",
  onConnect(session, cb) {
    console.log("conn de", session.remoteAddress);
    cb();
  },
  onRcptTo(address, _session, cb) {
    if (!aceita(address.address)) {
      console.log("rcpt REJEITADO:", address.address);
      return cb(new Error("550 5.7.1 relay not permitted"));
    }
    console.log("rcpt aceito:", address.address);
    cb();
  },
  onData(stream, session, cb) {
    simpleParser(stream)
      .then(async (parsed) => {
        const recipients = (session.envelope.rcptTo || [])
          .map((r) => r.address)
          .filter(aceita);
        const from =
          parsed.from?.value?.[0]?.address || session.envelope.mailFrom?.address || "desconhecido";
        for (const to of recipients) {
          await entregar({
            to,
            from,
            subject: parsed.subject || "",
            text: parsed.text || "",
            html: typeof parsed.html === "string" ? parsed.html : "",
          });
        }
        cb();
      })
      .catch((e) => {
        console.error("parse falhou", e?.message);
        cb(); // aceita e descarta (evita retry infinito por erro de parse)
      });
  },
});

server.on("error", (e) => console.error("smtp error", e?.message));
server.listen(PORT, "0.0.0.0", () => console.log(`vertente-mail ouvindo em :${PORT} para *.${ROOT}`));
