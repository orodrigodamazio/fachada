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

// Subdomínios (qualquer handle) caem na caixa do site. O apex <root> só aceita
// handles conhecidos (anti-spam) e o conteúdo vai pro log (uso pontual do dono:
// pegar códigos de verificação que serviços mandam pro domínio raiz).
const APEX_HANDLES = new Set([
  "contato", "postmaster", "admin", "administrador", "verificacao", "verification",
  "suporte", "atendimento", "security", "seguranca", "webmaster", "hostmaster",
  "no-reply", "noreply", "comercial", "financeiro", "mail", "email", "hello", "oi",
]);
function aceita(addr) {
  const a = String(addr || "").toLowerCase();
  const at = a.indexOf("@");
  if (at < 0) return false;
  const local = a.slice(0, at);
  const host = a.slice(at + 1);
  if (host.endsWith(`.${ROOT}`) && host !== ROOT) return true; // subdomínio: qualquer handle
  if (host === ROOT) return APEX_HANDLES.has(local); // apex: só handles conhecidos
  return false;
}

function ehApex(addr) {
  return String(addr || "").toLowerCase().split("@")[1] === ROOT;
}

function extrairCodigo(subject, text) {
  const m = `${subject || ""} ${text || ""}`.match(/\b(\d{4,8})\b/);
  return m ? m[1] : null;
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
          if (ehApex(to)) {
            // apex: não tem site associado; loga pro dono ler o código.
            const codigo = extrairCodigo(parsed.subject, parsed.text);
            console.log(`[APEX] to=${to} from=${from} codigo=${codigo || "-"} subject=${String(parsed.subject || "").slice(0, 80)}`);
            if (parsed.text) console.log(`[APEX] texto: ${String(parsed.text).replace(/\s+/g, " ").slice(0, 240)}`);
            continue;
          }
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
