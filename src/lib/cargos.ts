export type CargoCadastro = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
};

export const CARGOS_PADRAO = [
  "SOCIO",
  "FRANQUEADO",
  "PRESIDENTE",
  "DIRETOR",
  "DIR ADM",
  "DIR FIN",
  "DIR COM",
  "DIR MKT",
  "DIR OPER",
  "GER GERAL",
  "GER ADM",
  "GER FIN",
  "GER COM",
  "GER MKT",
  "GER LOJA",
  "GER TURNO",
  "GER PROD",
  "GER COZIN",
  "GER SALAO",
  "GER DELIV",
  "GER LOG",
  "GER RH",
  "GER TI",
  "SUPERVISOR",
  "SUP ADM",
  "SUP LOJA",
  "SUP PROD",
  "SUP COZIN",
  "SUP SALAO",
  "SUP CAIXA",
  "SUP DELIV",
  "COORD ADM",
  "COORD FIN",
  "COORD COM",
  "COORD MKT",
  "COORD LOJA",
  "COORD PROD",
  "COORD COZ",
  "COORD SALA",
  "COORD LOG",
  "COORD RH",
  "LIDER",
  "LID COZIN",
  "LID SALAO",
  "LID CAIXA",
  "LID PIZZA",
  "LID ENTREG",
  "ENCARREG",
  "ENC COZIN",
  "ENC SALAO",
  "ENC ESTOQ",
  "ENC LIMPEZ",
  "ENC DELIV",
  "ADMIN",
  "ADM GERAL",
  "ASS ADM",
  "AUX ADM",
  "SECRETARIA",
  "RECEPCION",
  "OFFICE BOY",
  "MENSAGEIRO",
  "ARQUIVISTA",
  "ANAL DOC",
  "AUX DOC",
  "DIGITADOR",
  "CADASTR",
  "FATURISTA",
  "CAIXA",
  "OP CAIXA",
  "TESOUREIRO",
  "ANAL FIN",
  "ASS FIN",
  "AUX FIN",
  "COBRADOR",
  "ANAL COBR",
  "CONTADOR",
  "CONTROLLER",
  "ECONOMISTA",
  "ANAL CONT",
  "ASS CONT",
  "AUX CONTAB",
  "FISCAL",
  "ANAL FISC",
  "ASS FISC",
  "AUX FISCAL",
  "AUDITOR",
  "ANAL CUSTO",
  "AUX CUSTO",
  "ANAL PCP",
  "AUX PCP",
  "ANAL DP",
  "ASS DP",
  "AUX DP",
  "FOLHISTA",
  "ANAL PONTO",
  "ANAL RH",
  "ASS RH",
  "AUX RH",
  "RECRUTADOR",
  "TREINADOR",
  "INSTRUTOR",
  "PSICOLOGO",
  "ASS SOCIAL",
  "MED TRAB",
  "ENF TRAB",
  "TEC ENF",
  "TEC SEG",
  "ENG SEG",
  "BRIGADISTA",
  "COMPRADOR",
  "COTADOR",
  "NEGOCIADOR",
  "ANAL COMPR",
  "ASS COMPR",
  "AUX COMPR",
  "ESTOQUISTA",
  "ALMOXARIFE",
  "AUX ESTOQ",
  "AUX ALMOX",
  "RECEBEDOR",
  "CONFERENTE",
  "SEPARADOR",
  "REPOSITOR",
  "INV ESTOQ",
  "FISC ESTOQ",
  "OP CAMARA",
  "CAMARISTA",
  "ANAL PERD",
  "PREV PERD",
  "AUX LOGIST",
  "ANAL LOG",
  "ROTEIRISTA",
  "DESPACHANT",
  "EXPEDIDOR",
  "EMBALADOR",
  "LOGISTICO",
  "MOTORISTA",
  "MOT FROTA",
  "MOT ENTREG",
  "MOTOBOY",
  "CICLISTA",
  "ENTREGADOR",
  "AUX ENTREG",
  "AJUD ENT",
  "CHEF COZ",
  "SUBCHEF",
  "COZINHEIRO",
  "AUX COZIN",
  "AJUD COZ",
  "PREPARADOR",
  "AUX PREP",
  "CORTADOR",
  "PORCIONAD",
  "MONTADOR",
  "AUX MONT",
  "FINALIZAD",
  "CHAPEIRO",
  "AUX CHAPA",
  "AJUD CHAPA",
  "GRELHADOR",
  "AUX GRELH",
  "FRITADEIRO",
  "AUX FRIT",
  "FORNEIRO",
  "AUX FORNO",
  "AJUD FORNO",
  "PIZZAIOLO",
  "AUX PIZZA",
  "AJUD PIZZ",
  "MASSEIRO",
  "AUX MASSA",
  "PADEIRO",
  "AUX PAO",
  "CONFEITEIR",
  "AUX CONFEI",
  "DOCEIRO",
  "SALGADEIRO",
  "PASTELEIRO",
  "ESFIRREIRO",
  "LANCHEIRO",
  "SALADEIRO",
  "PETISQUEIR",
  "SORVETEIRO",
  "ACAIZEIRO",
  "SUQUEIRO",
  "CHOPPEIRO",
  "BARTENDER",
  "BARMAN",
  "BARISTA",
  "SOMMELIER",
  "ACOUGUEIRO",
  "AUX ACOUG",
  "DESOSSADOR",
  "SUSHIMAN",
  "TEMAKIMAN",
  "DRINQUEIRO",
  "COQUETEIRO",
  "PRATISTA",
  "BOLEIRO",
  "NUTRICION",
  "TEC ALIM",
  "ENG ALIM",
  "ANAL QUAL",
  "AUX QUAL",
  "INSP QUAL",
  "AUD QUAL",
  "SEG ALIM",
  "TEC QUAL",
  "BIOLOGO",
  "ATENDENTE",
  "AUX ATEND",
  "BALCONISTA",
  "ATD BALCAO",
  "ATD SALAO",
  "ATD DELIV",
  "GARCOM",
  "GARCONETE",
  "CUMIM",
  "MAITRE",
  "HOSTESS",
  "COPEIRO",
  "AUX BAR",
  "OP TELEF",
  "TELEATEND",
  "ATD SAC",
  "OP DRIVE",
  "OP LOJA",
  "MANOBRISTA",
  "VALET",
  "GARAGISTA",
  "MONITOR",
  "RECREADOR",
  "BABYSITTER",
  "VENDEDOR",
  "CONS VENDA",
  "PROMOTOR",
  "PROM VEND",
  "REP COM",
  "TELEVENDAS",
  "ANAL CRM",
  "ASS COM",
  "AUX COM",
  "EXEC VEND",
  "PROSPECTOR",
  "SOCIAL MED",
  "GEST TRAF",
  "ANAL MKT",
  "ASS MKT",
  "AUX MKT",
  "MKT DIG",
  "DESIGNER",
  "DESIGN GR",
  "FOTOGRAFO",
  "VIDEOMAKER",
  "EDITOR VID",
  "COPYWRITER",
  "REDATOR",
  "CRIADOR",
  "ANAL ECOM",
  "ASS ECOM",
  "AUX ECOM",
  "WEBMASTER",
  "WEB DESIGN",
  "ANAL SIST",
  "SUP SIST",
  "TECNICO TI",
  "SUP TI",
  "DEV SIST",
  "DEV WEB",
  "DEV APP",
  "ANAL DADOS",
  "DBA",
  "FAXINEIRO",
  "LIMPADOR",
  "HIGIENIZ",
  "AUX LIMPEZ",
  "AUX S GER",
  "ZELADOR",
  "COLETOR",
  "RECICLADOR",
  "LAVADOR",
  "LAV UTENS",
  "TEC MANUT",
  "AUX MANUT",
  "MECANICO",
  "ELETRICIST",
  "ENCANADOR",
  "MARCENEIRO",
  "PINTOR",
  "PEDREIRO",
  "SERRALHEIR",
  "TEC REFRIG",
  "TEC GAS",
  "TEC FORNO",
  "VIGILANTE",
  "SEGURANCA",
  "PORTEIRO",
  "CTRL ACESS",
  "FISC LOJA",
  "ADVOGADO",
  "AUX JURID",
  "ANAL JUR",
  "CONSULTOR",
  "OP PRODUC",
  "OP EMBAL",
  "OP EXPED",
  "OP DELIV",
  "OP CHAPA",
  "OP FORNO",
  "OP FRITUR",
  "APRENDIZ",
  "ESTAGIARIO",
  "TRAINEE",
  "TEMPORARIO",
  "AUX GERAL",
  "AJUD GERAL",
  "DJ",
  "MUSICO",
  "ANIMADOR",
  "DECORADOR",
] as const;

const EVENTO_CARGOS = "turboponto:cargos-atualizados";

function chave(empresaId: string) {
  return `turboponto:cargos:${empresaId}`;
}

function listaPadrao(): CargoCadastro[] {
  return CARGOS_PADRAO.map((nome, indice) => ({
    id: `padrao-${indice + 1}`,
    codigo: String(indice + 1).padStart(4, "0"),
    nome,
    ativo: true,
  }));
}

export function carregarCargos(empresaId: string | null): CargoCadastro[] {
  if (!empresaId) return [];
  if (typeof window === "undefined") return listaPadrao();

  try {
    const salvo = window.localStorage.getItem(chave(empresaId));
    if (!salvo) return listaPadrao();

    const dados = JSON.parse(salvo) as unknown;
    if (!Array.isArray(dados)) return listaPadrao();

    const validos = dados.filter((item): item is CargoCadastro => {
      if (!item || typeof item !== "object") return false;
      const cargo = item as Partial<CargoCadastro>;
      return (
        typeof cargo.id === "string" &&
        typeof cargo.codigo === "string" &&
        typeof cargo.nome === "string" &&
        typeof cargo.ativo === "boolean"
      );
    });

    return validos.length ? validos : listaPadrao();
  } catch {
    return listaPadrao();
  }
}

export function salvarCargos(empresaId: string, cargos: CargoCadastro[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(chave(empresaId), JSON.stringify(cargos));
  window.dispatchEvent(new CustomEvent(EVENTO_CARGOS, { detail: { empresaId } }));
}

export function ouvirAtualizacaoCargos(empresaId: string, callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ empresaId?: string }>;
    if (!custom.detail?.empresaId || custom.detail.empresaId === empresaId) callback();
  };

  const storageHandler = (event: StorageEvent) => {
    if (event.key === chave(empresaId)) callback();
  };

  window.addEventListener(EVENTO_CARGOS, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENTO_CARGOS, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function proximoCodigoCargos(cargos: CargoCadastro[]) {
  const maior = cargos.reduce((maximo, cargo) => {
    const numero = Number.parseInt(cargo.codigo, 10);
    return Number.isFinite(numero) ? Math.max(maximo, numero) : maximo;
  }, 0);
  return String(maior + 1).padStart(4, "0");
}

export function criarCargoLocal(empresaId: string, nome: string) {
  const nomeFinal = nome.trim().toUpperCase();
  const cargos = carregarCargos(empresaId);
  const existente = cargos.find((cargo) => cargo.nome === nomeFinal);

  if (existente) {
    if (!existente.ativo) {
      const atualizados = cargos.map((cargo) =>
        cargo.id === existente.id ? { ...cargo, ativo: true } : cargo,
      );
      salvarCargos(empresaId, atualizados);
      return { ...existente, ativo: true };
    }
    return existente;
  }

  const novo: CargoCadastro = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `cargo-${Date.now()}`,
    codigo: proximoCodigoCargos(cargos),
    nome: nomeFinal,
    ativo: true,
  };

  salvarCargos(empresaId, [...cargos, novo]);
  return novo;
}
