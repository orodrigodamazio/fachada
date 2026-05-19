-- CreateEnum
CREATE TYPE "DominioStatus" AS ENUM ('NAO_CADASTRADO', 'PENDENTE_DNS', 'VERIFICADO', 'FALHA');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('NAO_CONFIGURADO', 'PENDENTE_MX', 'VERIFICADO', 'FALHA');

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "endereco" JSONB NOT NULL,
    "telefone" TEXT,
    "emailContato" TEXT,
    "cnaeFiscal" TEXT,
    "cnaeDescricao" TEXT,
    "capitalSocial" DECIMAL(65,30),
    "dataAbertura" TIMESTAMP(3),
    "socios" JSONB,
    "receitaRaw" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "heroTitulo" TEXT,
    "heroSubtitulo" TEXT,
    "sobre" TEXT,
    "missao" TEXT,
    "visao" TEXT,
    "servicos" JSONB,
    "rodape" TEXT,
    "dominioProprio" TEXT,
    "dominioStatus" "DominioStatus" NOT NULL DEFAULT 'NAO_CADASTRADO',
    "dominioVerifEm" TIMESTAMP(3),
    "cnameAlvo" TEXT,
    "emailHandle" TEXT,
    "emailForwardTo" TEXT,
    "emailStatus" "EmailStatus" NOT NULL DEFAULT 'NAO_CONFIGURADO',
    "emailVerifEm" TIMESTAMP(3),
    "mxRecords" JSONB,
    "spfRecord" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaPixel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_cnpj_key" ON "Site"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Site_dominioProprio_key" ON "Site"("dominioProprio");

-- CreateIndex
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "Site_dominioProprio_idx" ON "Site"("dominioProprio");

-- CreateIndex
CREATE INDEX "Site_cnpj_idx" ON "Site"("cnpj");
