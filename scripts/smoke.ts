import "dotenv/config";
import { consultarCnpj, gerarSlug } from "../src/lib/cnpj";
import { prisma } from "../src/lib/prisma";

const cnpj = process.argv[2] ?? "47960950000121";

console.log("→ consultando minhareceita:", cnpj);
const r = await consultarCnpj(cnpj);
console.log("  razao_social:", r.razao_social);
console.log("  porte:", r.porte, "uf:", r.uf, "cnae:", r.cnae_fiscal_descricao?.slice(0, 50));

const slug = gerarSlug(r.razao_social, cnpj);
console.log("→ slug gerado:", slug);

const existe = await prisma.site.findUnique({ where: { cnpj }, select: { slug: true } });
if (existe) {
  console.log("✓ já existe, slug:", existe.slug);
} else {
  await prisma.site.create({
    data: {
      cnpj,
      slug,
      razaoSocial: r.razao_social,
      nomeFantasia: r.nome_fantasia,
      endereco: {
        logradouro: r.logradouro,
        numero: r.numero,
        complemento: r.complemento,
        bairro: r.bairro,
        municipio: r.municipio,
        uf: r.uf,
        cep: r.cep,
      },
      telefone: r.ddd_telefone_1,
      emailContato: r.email,
      cnaeFiscal: r.cnae_fiscal ? String(r.cnae_fiscal) : null,
      cnaeDescricao: r.cnae_fiscal_descricao,
      capitalSocial: r.capital_social ?? null,
      dataAbertura: r.data_inicio_atividade ? new Date(r.data_inicio_atividade) : null,
      socios: r.qsa as unknown as object,
      receitaRaw: r as unknown as object,
    },
  });
  console.log("✓ persistido");
}

const url = `http://localhost:3000/preview/${slug}`;
const res = await fetch(url);
console.log("→ GET", url, "→", res.status);
if (res.ok) {
  const html = await res.text();
  const tem = ["Identificação", "Razão social", "Contato"].filter((s) => html.includes(s));
  console.log("  conteúdo encontrado:", tem.join(", ") || "NADA");
}

await prisma.$disconnect();
