import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export type EscopoDocumento = "funcionario" | "empresa";
export type ObrigatoriedadeDocumento = "obrigatorio" | "quando_aplicavel" | "recomendado";
export type AssinaturaDocumento = "nao_aplicavel" | "pendente" | "assinado" | "recusado";
export type StatusDocumento = "valido" | "vencendo" | "vencido" | "sem_vencimento" | "arquivado";

export type TipoDocumento = {
  id: string;
  nome: string;
  categoria: string;
  escopo: EscopoDocumento | "ambos";
  obrigatoriedade: ObrigatoriedadeDocumento;
  descricao: string;
  modelo?: boolean;
  validadeDias?: number;
};

export type DocumentoRH = {
  id: string;
  empresaId: string;
  funcionarioId: string | null;
  escopo: EscopoDocumento;
  tipoId: string;
  tipoNome: string;
  categoria: string;
  titulo: string;
  dataDocumento: string;
  dataVencimento: string | null;
  assinatura: AssinaturaDocumento;
  responsavel: string;
  observacoes: string;
  arquivado: boolean;
  arquivoNome: string | null;
  arquivoTipo: string | null;
  arquivoTamanho: number | null;
  storagePath: string | null;
  storageBucket: string | null;
  localFileId: string | null;
  origemArquivo: "gerado_pdf" | "anexado" | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type FuncionarioDocumento = {
  id: string;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  cargo?: string | null;
  matricula?: string | null;
  data_admissao?: string | null;
  data_desligamento?: string | null;
  endereco?: string | null;
};

export type EmpresaDocumento = {
  nome_fantasia?: string | null;
  razao_social?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  responsavel?: string | null;
};

const T = (
  id: string,
  nome: string,
  categoria: string,
  escopo: TipoDocumento["escopo"],
  obrigatoriedade: ObrigatoriedadeDocumento,
  descricao: string,
  modelo = false,
  validadeDias?: number,
): TipoDocumento => ({ id, nome, categoria, escopo, obrigatoriedade, descricao, modelo, validadeDias });

export const CATALOGO_DOCUMENTOS: TipoDocumento[] = [
  // Admissão e cadastro
  T("ficha_registro", "Ficha/registro do empregado", "Admissão e cadastro", "funcionario", "obrigatorio", "Registro cadastral e contratual do trabalhador.", true),
  T("recibo_esocial_admissao", "Recibo eSocial S-2200/S-2190", "Admissão e cadastro", "funcionario", "obrigatorio", "Comprovante de envio da admissão ao eSocial."),
  T("recibo_esocial_cadastral", "Recibo eSocial S-2205", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Comprovante de alteração de dados cadastrais do trabalhador."),
  T("ctps_digital", "Comprovante da CTPS Digital", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Comprovante de dados da Carteira de Trabalho Digital."),
  T("cpf", "CPF", "Admissão e cadastro", "funcionario", "obrigatorio", "Documento cadastral do trabalhador."),
  T("rg", "RG/CIN", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Documento de identificação civil."),
  T("pis_nit", "PIS/PASEP/NIT", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Comprovante de inscrição previdenciária."),
  T("comprovante_endereco", "Comprovante de endereço", "Admissão e cadastro", "funcionario", "recomendado", "Comprovante de residência atualizado."),
  T("certidao_nascimento_casamento", "Certidão civil", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Certidão de nascimento, casamento ou união estável."),
  T("titulo_eleitor", "Título de eleitor", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Documento eleitoral, quando solicitado."),
  T("reservista", "Certificado militar", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Documento de quitação militar, quando aplicável."),
  T("cnh", "CNH", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Obrigatória para funções que exijam habilitação.", false, 1825),
  T("escolaridade", "Diploma/certificado escolar", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Comprovação de escolaridade ou habilitação profissional."),
  T("registro_profissional", "Registro profissional", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Registro em conselho ou órgão profissional.", false, 365),
  T("dados_bancarios", "Comprovante de dados bancários", "Admissão e cadastro", "funcionario", "recomendado", "Dados para pagamento salarial."),
  T("dependentes", "Declaração de dependentes", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Dependentes para IRRF e salário-família.", true),
  T("salario_familia", "Documentos do salário-família", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Certidões e comprovantes exigidos para concessão."),
  T("qualificacao_cadastral", "Consulta de qualificação cadastral", "Admissão e cadastro", "funcionario", "recomendado", "Conferência dos dados para o eSocial."),
  T("termo_dados_pessoais", "Termo de ciência sobre dados pessoais", "Admissão e cadastro", "funcionario", "recomendado", "Ciência sobre tratamento de dados pessoais no vínculo.", true),
  T("autorizacao_imagem", "Autorização de uso de imagem", "Admissão e cadastro", "funcionario", "quando_aplicavel", "Autorização específica para uso de imagem e voz.", true),

  // Contratos e alterações
  T("contrato_indeterminado", "Contrato por prazo indeterminado", "Contratos e alterações", "funcionario", "recomendado", "Instrumento escrito do contrato de trabalho.", true),
  T("contrato_experiencia", "Contrato de experiência", "Contratos e alterações", "funcionario", "quando_aplicavel", "Contrato por prazo determinado para experiência.", true),
  T("prorrogacao_experiencia", "Prorrogação de experiência", "Contratos e alterações", "funcionario", "quando_aplicavel", "Termo de prorrogação do contrato de experiência.", true),
  T("contrato_prazo_determinado", "Contrato por prazo determinado", "Contratos e alterações", "funcionario", "quando_aplicavel", "Contrato com termo ou condição de encerramento.", true),
  T("contrato_intermitente", "Contrato intermitente", "Contratos e alterações", "funcionario", "quando_aplicavel", "Contrato escrito para trabalho intermitente.", true),
  T("contrato_parcial", "Contrato em regime parcial", "Contratos e alterações", "funcionario", "quando_aplicavel", "Contrato com jornada em tempo parcial.", true),
  T("contrato_teletrabalho", "Aditivo de teletrabalho", "Contratos e alterações", "funcionario", "quando_aplicavel", "Regras de trabalho remoto, equipamentos e responsabilidades.", true),
  T("contrato_aprendiz", "Contrato de aprendizagem", "Contratos e alterações", "funcionario", "quando_aplicavel", "Contrato especial de aprendizagem.", true),
  T("contrato_temporario", "Contrato de trabalho temporário", "Contratos e alterações", "funcionario", "quando_aplicavel", "Documentação da contratação temporária.", true),
  T("termo_estagio", "Termo de compromisso de estágio", "Contratos e alterações", "funcionario", "quando_aplicavel", "Documento do estágio, que não constitui vínculo CLT quando regular."),
  T("descricao_cargo", "Descrição de cargo e atividades", "Contratos e alterações", "funcionario", "recomendado", "Descrição das atribuições, responsabilidades e requisitos.", true),
  T("aditivo_salarial", "Aditivo de alteração salarial", "Contratos e alterações", "funcionario", "quando_aplicavel", "Registro de reajuste ou mudança de remuneração.", true),
  T("aditivo_cargo", "Aditivo de cargo/função", "Contratos e alterações", "funcionario", "quando_aplicavel", "Registro de promoção, reenquadramento ou mudança de função.", true),
  T("aditivo_jornada", "Aditivo de jornada/horário", "Contratos e alterações", "funcionario", "quando_aplicavel", "Alteração de jornada ou horário de trabalho.", true),
  T("aditivo_local", "Aditivo de local/transferência", "Contratos e alterações", "funcionario", "quando_aplicavel", "Alteração do local de trabalho ou transferência.", true),
  T("recibo_esocial_contrato", "Recibo eSocial S-2206", "Contratos e alterações", "funcionario", "quando_aplicavel", "Comprovante de alteração do contrato de trabalho."),
  T("reintegracao", "Termo/decisão de reintegração", "Contratos e alterações", "funcionario", "quando_aplicavel", "Documentação da reintegração do trabalhador."),
  T("recibo_esocial_reintegracao", "Recibo eSocial S-2298", "Contratos e alterações", "funcionario", "quando_aplicavel", "Comprovante do evento de reintegração."),
  T("acordo_compensacao", "Acordo de compensação de jornada", "Contratos e alterações", "funcionario", "quando_aplicavel", "Acordo para compensação de horários.", true),
  T("acordo_banco_horas", "Acordo de banco de horas", "Contratos e alterações", "funcionario", "quando_aplicavel", "Acordo individual ou coletivo de banco de horas.", true),
  T("acordo_prorrogacao", "Acordo de prorrogação de jornada", "Contratos e alterações", "funcionario", "quando_aplicavel", "Acordo para horas suplementares.", true),
  T("termo_confidencialidade", "Termo de confidencialidade", "Contratos e alterações", "funcionario", "recomendado", "Proteção de informações confidenciais da empresa.", true),
  T("termo_nao_concorrencia", "Termo de não concorrência", "Contratos e alterações", "funcionario", "quando_aplicavel", "Cláusulas especiais sujeitas a validação jurídica.", true),
  T("termo_uniforme", "Termo de entrega de uniforme", "Contratos e alterações", "funcionario", "quando_aplicavel", "Controle de entrega e devolução de uniformes.", true),
  T("termo_equipamentos", "Termo de entrega de equipamentos", "Contratos e alterações", "funcionario", "quando_aplicavel", "Controle de bens, ferramentas e equipamentos.", true),
  T("regulamento_interno", "Ciência do regulamento interno", "Contratos e alterações", "funcionario", "recomendado", "Comprovante de recebimento das regras internas.", true),
  T("codigo_conduta", "Ciência do código de conduta", "Contratos e alterações", "funcionario", "recomendado", "Comprovante de ciência das normas de conduta.", true),

  // Jornada, férias e afastamentos
  T("espelho_ponto", "Espelho/cartão de ponto", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Registro de entradas, saídas e intervalos."),
  T("escala_trabalho", "Escala de trabalho", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Escala e revezamentos aplicáveis ao trabalhador."),
  T("acordo_12x36", "Acordo de jornada 12x36", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Instrumento aplicável à jornada 12x36.", true),
  T("atestado_medico", "Atestado médico", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Documento para justificativa de ausência ou afastamento."),
  T("declaracao_comparecimento", "Declaração de comparecimento", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Comprovante de comparecimento a atendimento."),
  T("comunicado_afastamento", "Comunicado de afastamento", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Registro interno de afastamento temporário.", true),
  T("recibo_esocial_afastamento", "Recibo eSocial S-2230", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Comprovante do evento de afastamento."),
  T("decisao_inss", "Decisão/comunicado do INSS", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Concessão, indeferimento, prorrogação ou cessação de benefício."),
  T("aviso_ferias", "Aviso de férias", "Jornada, férias e afastamentos", "funcionario", "obrigatorio", "Comunicação do período de férias.", true),
  T("recibo_ferias", "Recibo de férias", "Jornada, férias e afastamentos", "funcionario", "obrigatorio", "Comprovante do pagamento das férias.", true),
  T("abono_pecuniario", "Requerimento de abono pecuniário", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Pedido de conversão de parte das férias em abono.", true),
  T("ferias_coletivas", "Comunicado de férias coletivas", "Jornada, férias e afastamentos", "ambos", "quando_aplicavel", "Documentação de férias coletivas."),
  T("licenca_maternidade", "Documentos de licença-maternidade", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Atestados, certidão e comprovantes relacionados."),
  T("licenca_paternidade", "Documentos de licença-paternidade", "Jornada, férias e afastamentos", "funcionario", "quando_aplicavel", "Certidão e registros relacionados."),

  // Folha e benefícios
  T("holerite", "Holerite/contracheque", "Folha, encargos e benefícios", "funcionario", "obrigatorio", "Demonstrativo de pagamento salarial."),
  T("recibo_pagamento", "Recibo de pagamento", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Comprovante de pagamento específico."),
  T("recibo_adiantamento", "Recibo de adiantamento salarial", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Comprovante de adiantamento."),
  T("recibo_13", "Recibo de 13º salário", "Folha, encargos e benefícios", "funcionario", "obrigatorio", "Comprovante das parcelas do 13º salário."),
  T("termo_vale_transporte", "Opção/renúncia de vale-transporte", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Solicitação, atualização ou renúncia ao benefício.", true),
  T("vale_alimentacao", "Termo de benefício alimentação", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Regras e comprovantes do benefício."),
  T("plano_saude", "Termo de plano de saúde", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Adesão, alteração ou cancelamento."),
  T("seguro_vida", "Termo de seguro de vida", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Adesão, beneficiários e comprovantes."),
  T("comissao_premiacao", "Demonstrativo de comissão/premiação", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Memória de cálculo de parcelas variáveis."),
  T("emprestimo_desconto", "Autorização de desconto/empréstimo", "Folha, encargos e benefícios", "funcionario", "quando_aplicavel", "Autorização e condições do desconto.", true),
  T("informe_rendimentos", "Informe de rendimentos", "Folha, encargos e benefícios", "funcionario", "obrigatorio", "Comprovante anual de rendimentos e retenções."),
  T("folha_pagamento", "Folha de pagamento", "Folha, encargos e benefícios", "empresa", "obrigatorio", "Folhas e resumos mensais da empresa."),
  T("dctfweb", "DCTFWeb e recibos", "Folha, encargos e benefícios", "empresa", "quando_aplicavel", "Declarações e recibos de obrigações previdenciárias."),
  T("fgts_digital", "FGTS Digital: guias e comprovantes", "Folha, encargos e benefícios", "empresa", "obrigatorio", "Guias e comprovantes de recolhimento do FGTS."),
  T("esocial_folha", "eSocial: fechamento e recibos", "Folha, encargos e benefícios", "empresa", "obrigatorio", "Recibos de eventos periódicos e fechamento."),

  // SST
  T("aso_admissional", "ASO admissional", "Saúde e segurança do trabalho", "funcionario", "obrigatorio", "Atestado de Saúde Ocupacional antes do início das atividades."),
  T("aso_periodico", "ASO periódico", "Saúde e segurança do trabalho", "funcionario", "obrigatorio", "Monitoramento periódico da saúde ocupacional.", false, 365),
  T("aso_retorno", "ASO de retorno ao trabalho", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Exame de retorno após afastamentos previstos."),
  T("aso_mudanca_risco", "ASO de mudança de risco", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Exame relacionado à mudança de risco ocupacional."),
  T("aso_demissional", "ASO demissional", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Exame médico ocupacional de desligamento."),
  T("exames_complementares", "Exames ocupacionais complementares", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Exames definidos pelo PCMSO, preservado o sigilo médico."),
  T("ficha_epi", "Ficha de entrega e controle de EPI", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Entrega, substituição, treinamento e devolução de EPI.", true),
  T("ordem_servico_sst", "Ordem de serviço de SST", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Orientações de segurança aplicáveis à função.", true),
  T("treinamento_integracao", "Treinamento de integração", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Registro de integração e orientações iniciais.", true),
  T("certificado_nr", "Certificado de treinamento NR", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Certificado de capacitação exigida para a atividade.", false, 730),
  T("cat", "Comunicação de Acidente de Trabalho - CAT", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "CAT inicial, reabertura ou comunicação de óbito."),
  T("recibo_cat", "Recibo eSocial S-2210", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Comprovante de transmissão da CAT."),
  T("ppp", "PPP eletrônico", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Perfil Profissiográfico Previdenciário."),
  T("recibo_s2220", "Recibo eSocial S-2220", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Evento de monitoramento da saúde."),
  T("recibo_s2240", "Recibo eSocial S-2240", "Saúde e segurança do trabalho", "funcionario", "quando_aplicavel", "Evento de condições ambientais e agentes nocivos."),
  T("pgr", "PGR/GRO", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Programa de Gerenciamento de Riscos e inventário de riscos.", false, 365),
  T("pcmso", "PCMSO", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Programa de Controle Médico de Saúde Ocupacional.", false, 365),
  T("relatorio_pcmso", "Relatório analítico do PCMSO", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Relatório periódico do programa médico."),
  T("ltcat", "LTCAT", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Laudo Técnico das Condições Ambientais do Trabalho."),
  T("laudo_insalubridade", "Laudo de insalubridade", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Avaliação de exposição e caracterização."),
  T("laudo_periculosidade", "Laudo de periculosidade", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Avaliação e caracterização de periculosidade."),
  T("cipa", "Documentação da CIPA/designado", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Eleição, atas, treinamentos e registros."),
  T("sipAT", "Documentação da SIPAT", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Programação, presença e evidências da semana interna."),
  T("mapa_riscos", "Mapas e avaliações de riscos", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Mapas, avaliações qualitativas e quantitativas."),
  T("plano_emergencia", "Plano de emergência", "Saúde e segurança do trabalho", "empresa", "quando_aplicavel", "Procedimentos de resposta a emergências."),

  // Medidas disciplinares
  T("orientacao_verbal", "Registro de orientação verbal", "Medidas disciplinares", "funcionario", "recomendado", "Registro objetivo de orientação realizada.", true),
  T("ajuste_conduta", "Termo de ajuste de conduta", "Medidas disciplinares", "funcionario", "recomendado", "Plano de correção de conduta com compromissos e acompanhamento.", true),
  T("advertencia", "Advertência disciplinar", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Advertência escrita com descrição objetiva do fato.", true),
  T("suspensao", "Suspensão disciplinar", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Suspensão com período e fundamentação do fato.", true),
  T("relato_ocorrencia", "Relato de ocorrência", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Registro de fatos, datas, envolvidos e evidências.", true),
  T("apuracao_interna", "Relatório de apuração interna", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Apuração imparcial de ocorrência ou denúncia.", true),
  T("declaracao_testemunha", "Declaração de testemunha", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Relato assinado por testemunha.", true),
  T("recusa_assinatura", "Termo de recusa de assinatura", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Registro de recusa com testemunhas.", true),
  T("defesa_empregado", "Manifestação/defesa do empregado", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Documento apresentado pelo trabalhador."),
  T("plano_melhoria", "Plano de melhoria de desempenho", "Medidas disciplinares", "funcionario", "recomendado", "Metas, prazo, apoio e acompanhamento.", true),
  T("denuncia_assedio", "Registro de denúncia/assédio", "Medidas disciplinares", "funcionario", "quando_aplicavel", "Registro restrito de denúncia e providências."),

  // Desligamento
  T("pedido_demissao", "Pedido de demissão", "Desligamento", "funcionario", "quando_aplicavel", "Manifestação escrita do trabalhador.", true),
  T("dispensa_sem_justa", "Comunicado de dispensa sem justa causa", "Desligamento", "funcionario", "quando_aplicavel", "Comunicação do desligamento por iniciativa do empregador.", true),
  T("dispensa_justa", "Comunicado de dispensa por justa causa", "Desligamento", "funcionario", "quando_aplicavel", "Comunicação com motivo específico e validação jurídica.", true),
  T("acordo_484a", "Acordo de extinção - art. 484-A", "Desligamento", "funcionario", "quando_aplicavel", "Documento da extinção por acordo entre as partes.", true),
  T("rescisao_indireta", "Documentos de rescisão indireta", "Desligamento", "funcionario", "quando_aplicavel", "Documentos judiciais ou extrajudiciais relacionados."),
  T("termino_experiencia", "Comunicado de término de experiência", "Desligamento", "funcionario", "quando_aplicavel", "Encerramento do contrato de experiência.", true),
  T("termino_prazo", "Comunicado de término de contrato", "Desligamento", "funcionario", "quando_aplicavel", "Encerramento normal de contrato a termo.", true),
  T("rescisao_antecipada_empregador", "Rescisão antecipada pelo empregador", "Desligamento", "funcionario", "quando_aplicavel", "Encerramento antecipado de contrato a termo.", true),
  T("rescisao_antecipada_empregado", "Rescisão antecipada pelo empregado", "Desligamento", "funcionario", "quando_aplicavel", "Pedido de encerramento antecipado de contrato a termo.", true),
  T("desligamento_falecimento", "Desligamento por falecimento", "Desligamento", "funcionario", "quando_aplicavel", "Documentação do óbito e pagamento aos legitimados."),
  T("desligamento_aposentadoria", "Desligamento relacionado à aposentadoria", "Desligamento", "funcionario", "quando_aplicavel", "Documentação do caso concreto."),
  T("desligamento_transferencia", "Transferência/sucessão de empregador", "Desligamento", "funcionario", "quando_aplicavel", "Documentos de transferência, sucessão, fusão ou incorporação."),
  T("culpa_reciproca", "Rescisão por culpa recíproca", "Desligamento", "funcionario", "quando_aplicavel", "Documentação judicial ou acordo homologado do caso concreto."),
  T("forca_maior", "Rescisão por força maior", "Desligamento", "funcionario", "quando_aplicavel", "Documentos que comprovem a hipótese e os cálculos aplicáveis."),
  T("extincao_empresa", "Desligamento por extinção da empresa", "Desligamento", "funcionario", "quando_aplicavel", "Documentos societários, comunicação e rescisão correspondentes."),
  T("decisao_judicial_desligamento", "Desligamento por decisão judicial", "Desligamento", "funcionario", "quando_aplicavel", "Sentença, acordo homologado e comprovantes de cumprimento."),
  T("aviso_previo_trabalhado", "Aviso-prévio trabalhado", "Desligamento", "funcionario", "quando_aplicavel", "Comunicação e ciência do aviso trabalhado.", true),
  T("aviso_previo_indenizado", "Aviso-prévio indenizado", "Desligamento", "funcionario", "quando_aplicavel", "Comunicação e projeção do aviso indenizado.", true),
  T("trct", "TRCT", "Desligamento", "funcionario", "quando_aplicavel", "Termo de Rescisão do Contrato de Trabalho."),
  T("termo_homologacao", "Termo de homologação/quitação", "Desligamento", "funcionario", "quando_aplicavel", "Termos aplicáveis à modalidade e ao caso concreto."),
  T("demonstrativo_rescisao", "Demonstrativo de cálculo rescisório", "Desligamento", "funcionario", "quando_aplicavel", "Memória de cálculo das verbas rescisórias."),
  T("recibo_rescisao", "Comprovante de pagamento da rescisão", "Desligamento", "funcionario", "obrigatorio", "Comprovante de pagamento das verbas rescisórias."),
  T("guia_fgts_rescisorio", "Guia/FGTS rescisório", "Desligamento", "funcionario", "quando_aplicavel", "Guia, comprovante e informações para saque."),
  T("seguro_desemprego", "Requerimento do seguro-desemprego", "Desligamento", "funcionario", "quando_aplicavel", "Requerimento e comprovantes de entrega."),
  T("recibo_esocial_desligamento", "Recibo eSocial S-2299", "Desligamento", "funcionario", "obrigatorio", "Comprovante do evento de desligamento."),
  T("devolucao_bens", "Termo de devolução de bens", "Desligamento", "funcionario", "quando_aplicavel", "Devolução de uniforme, chaves, equipamentos e acessos.", true),
  T("entrevista_desligamento", "Entrevista de desligamento", "Desligamento", "funcionario", "recomendado", "Registro de entrevista e devolutivas.", true),
  T("declaracao_ultimo_dia", "Declaração de último dia trabalhado", "Desligamento", "funcionario", "quando_aplicavel", "Comprovação da data de encerramento das atividades.", true),

  // Empresa e conformidade
  T("cartao_cnpj", "Cartão CNPJ", "Empresa e conformidade", "empresa", "obrigatorio", "Comprovante de inscrição e situação cadastral."),
  T("contrato_social", "Contrato social e alterações", "Empresa e conformidade", "empresa", "obrigatorio", "Atos constitutivos e alterações."),
  T("inscricao_estadual_municipal", "Inscrições estadual/municipal", "Empresa e conformidade", "empresa", "quando_aplicavel", "Comprovantes cadastrais tributários."),
  T("alvara_funcionamento", "Alvará de funcionamento", "Empresa e conformidade", "empresa", "quando_aplicavel", "Licença municipal para funcionamento.", false, 365),
  T("licenca_sanitaria", "Licença sanitária", "Empresa e conformidade", "empresa", "quando_aplicavel", "Licença sanitária aplicável ao estabelecimento.", false, 365),
  T("avcb", "AVCB/CLCB", "Empresa e conformidade", "empresa", "quando_aplicavel", "Documento do Corpo de Bombeiros.", false, 365),
  T("certificado_digital", "Certificado digital", "Empresa e conformidade", "empresa", "quando_aplicavel", "Controle de validade do certificado.", false, 365),
  T("convencao_coletiva", "Convenção coletiva de trabalho", "Empresa e conformidade", "empresa", "quando_aplicavel", "Instrumento coletivo vigente da categoria.", false, 365),
  T("acordo_coletivo", "Acordo coletivo de trabalho", "Empresa e conformidade", "empresa", "quando_aplicavel", "Acordo firmado com entidade sindical.", false, 365),
  T("cadastro_sindical", "Dados e guias sindicais", "Empresa e conformidade", "empresa", "quando_aplicavel", "Documentação sindical aplicável."),
  T("det", "Domicílio Eletrônico Trabalhista - DET", "Empresa e conformidade", "empresa", "obrigatorio", "Comprovantes, procurações e comunicações do DET."),
  T("registro_ponto_rep", "Documentação do sistema de ponto/REP", "Empresa e conformidade", "empresa", "quando_aplicavel", "Atestados, termos, certificados e arquivos do controle de ponto."),
  T("politica_lgpd", "Políticas e registros de proteção de dados", "Empresa e conformidade", "empresa", "quando_aplicavel", "Políticas, inventários, bases legais e controles de acesso."),
  T("politica_assedio", "Política de prevenção ao assédio", "Empresa e conformidade", "empresa", "recomendado", "Política, canal, treinamentos e apurações."),
  T("auditoria_trabalhista", "Auditorias e fiscalizações trabalhistas", "Empresa e conformidade", "empresa", "quando_aplicavel", "Autos, notificações, respostas e planos de ação."),
  T("procuracoes", "Procurações trabalhistas/eSocial", "Empresa e conformidade", "empresa", "quando_aplicavel", "Procurações e autorizações de acesso."),
  T("outro", "Outro documento", "Outros", "ambos", "quando_aplicavel", "Documento personalizado cadastrado pela empresa."),
];

export const CATEGORIAS_DOCUMENTOS = Array.from(new Set(CATALOGO_DOCUMENTOS.map((item) => item.categoria)));

const localKey = (empresaId: string) => `turboponto:documentacao:${empresaId}`;

// Usa primeiro o bucket privado já utilizado pelo sistema. Os demais ficam apenas
// como compatibilidade com instalações antigas do projeto.
const DOCUMENT_READ_BUCKETS = ["holerites", "backup", "company-assets"] as const;
const DOCUMENT_WRITE_BUCKETS = ["holerites", "backup"] as const;
type DocumentBucket = (typeof DOCUMENT_READ_BUCKETS)[number];
const indexPath = (empresaId: string) => `${empresaId}/_documentacao/index.json`;
const legacyIndexPath = (empresaId: string) => `${empresaId}/documentacao/index.json`;

function normalizarLista(value: unknown, empresaId: string): DocumentoRH[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is DocumentoRH => !!item && typeof item === "object" && "id" in item)
    .map((item) => ({
      ...item,
      empresaId,
      storageBucket: item.storageBucket ?? (item.storagePath ? "company-assets" : null),
      origemArquivo: item.origemArquivo ?? (item.arquivoNome ? "anexado" : null),
    }));
}

function lerLocal(empresaId: string): DocumentoRH[] {
  if (typeof window === "undefined") return [];
  try {
    return normalizarLista(JSON.parse(localStorage.getItem(localKey(empresaId)) ?? "[]"), empresaId);
  } catch {
    return [];
  }
}

function salvarLocal(empresaId: string, documentos: DocumentoRH[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(localKey(empresaId), JSON.stringify(documentos));
}

function mensagemErro(error: unknown) {
  if (!error || typeof error !== "object") return String(error ?? "");
  const value = error as { message?: string; error?: string; statusCode?: string | number; status?: string | number };
  return `${value.message ?? ""} ${value.error ?? ""} ${value.statusCode ?? ""} ${value.status ?? ""}`.trim();
}

function objetoNaoEncontrado(error: unknown) {
  const texto = mensagemErro(error).toLowerCase();
  return !texto.includes("bucket") && (texto.includes("not found") || texto.includes("object not found") || /(^|\s)404(\s|$)/.test(texto));
}

async function baixarIndice(bucket: DocumentBucket, path: string, empresaId: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) return { documentos: null as DocumentoRH[] | null, inexistente: objetoNaoEncontrado(error), erro: mensagemErro(error) };
  try {
    return { documentos: normalizarLista(JSON.parse(await data.text()), empresaId), inexistente: false, erro: "" };
  } catch {
    return { documentos: null as DocumentoRH[] | null, inexistente: false, erro: "Índice de documentação inválido" };
  }
}

export async function carregarDocumentos(empresaId: string): Promise<{ documentos: DocumentoRH[]; remoto: boolean }> {
  const local = lerLocal(empresaId);
  const tentativas: { documentos: DocumentoRH[]; bucket: DocumentBucket }[] = [];
  let armazenamentoEncontrado = false;

  for (const bucket of DOCUMENT_READ_BUCKETS) {
    for (const path of [indexPath(empresaId), legacyIndexPath(empresaId)]) {
      const resultado = await baixarIndice(bucket, path, empresaId);
      if (resultado.documentos) {
        armazenamentoEncontrado = true;
        tentativas.push({ documentos: resultado.documentos, bucket });
        break;
      }
      if (resultado.inexistente) armazenamentoEncontrado = true;
    }
  }

  if (tentativas.length) {
    const maisAtual = tentativas.sort((a, b) => {
      const dataA = Math.max(0, ...a.documentos.map((doc) => Date.parse(doc.atualizadoEm || doc.criadoEm || "") || 0));
      const dataB = Math.max(0, ...b.documentos.map((doc) => Date.parse(doc.atualizadoEm || doc.criadoEm || "") || 0));
      return dataB - dataA;
    })[0].documentos;

    const porId = new Map(maisAtual.map((doc) => [doc.id, doc]));
    for (const localDoc of local) {
      const remotoDoc = porId.get(localDoc.id);
      const localData = Date.parse(localDoc.atualizadoEm || localDoc.criadoEm || "") || 0;
      const remotoData = remotoDoc ? Date.parse(remotoDoc.atualizadoEm || remotoDoc.criadoEm || "") || 0 : -1;
      if (!remotoDoc || localData > remotoData) porId.set(localDoc.id, localDoc);
    }
    const mesclados = Array.from(porId.values()).sort((a, b) => b.dataDocumento.localeCompare(a.dataDocumento));
    salvarLocal(empresaId, mesclados);
    const existeArquivoSomenteLocal = mesclados.some((doc) => !!doc.localFileId && !doc.storagePath);
    return { documentos: mesclados, remoto: !existeArquivoSomenteLocal };
  }

  // Um índice inexistente em uma instalação nova não é erro de armazenamento.
  const existeArquivoSomenteLocal = local.some((doc) => !!doc.localFileId && !doc.storagePath);
  return { documentos: local, remoto: !existeArquivoSomenteLocal && (armazenamentoEncontrado || local.length === 0) };
}

async function enviarIndiceParaBucket(bucket: DocumentBucket, empresaId: string, blob: Blob) {
  const { error } = await supabase.storage.from(bucket).upload(indexPath(empresaId), blob, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw error;
}

export async function salvarDocumentos(
  empresaId: string,
  documentos: DocumentoRH[],
): Promise<{ remoto: boolean; erro?: string; bucket?: string }> {
  salvarLocal(empresaId, documentos);
  const existeArquivoSomenteLocal = documentos.some((doc) => !!doc.localFileId && !doc.storagePath);
  const documentosSincronizaveis = documentos.filter((doc) => !doc.localFileId || !!doc.storagePath);
  const blob = new Blob([JSON.stringify(documentosSincronizaveis, null, 2)], { type: "application/json" });
  const erros: string[] = [];

  for (const bucket of DOCUMENT_WRITE_BUCKETS) {
    try {
      await enviarIndiceParaBucket(bucket, empresaId, blob);
      if (existeArquivoSomenteLocal) {
        return { remoto: false, bucket, erro: "Há arquivo(s) preservado(s) somente neste dispositivo" };
      }
      return { remoto: true, bucket };
    } catch (error) {
      erros.push(`${bucket}: ${mensagemErro(error) || "falha no envio"}`);
    }
  }

  return { remoto: false, erro: erros.join(" | ") || "Falha ao sincronizar documentos" };
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("turboponto-documentacao", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("arquivos")) db.createObjectStore("arquivos");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function salvarArquivoLocal(id: string, file: File) {
  const db = await abrirDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("arquivos", "readwrite");
    tx.objectStore("arquivos").put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function obterArquivoLocal(id: string): Promise<Blob | null> {
  const db = await abrirDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction("arquivos", "readonly");
    const request = tx.objectStore("arquivos").get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return blob;
}

async function removerArquivoLocal(id: string) {
  const db = await abrirDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("arquivos", "readwrite");
    tx.objectStore("arquivos").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-100);
}

export async function enviarArquivoDocumento(
  empresaId: string,
  documentoId: string,
  file: File,
  funcionarioId?: string | null,
): Promise<{ storagePath: string | null; storageBucket: string | null; localFileId: string | null; remoto: boolean; erro?: string }> {
  const pasta = funcionarioId || "_empresa";
  const path = `${empresaId}/${pasta}/documentacao/${documentoId}-${nomeSeguro(file.name)}`;
  const erros: string[] = [];

  for (const bucket of DOCUMENT_WRITE_BUCKETS) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
        cacheControl: "0",
      });
      if (error) throw error;
      return { storagePath: path, storageBucket: bucket, localFileId: null, remoto: true };
    } catch (error) {
      erros.push(`${bucket}: ${mensagemErro(error) || "falha no envio"}`);
    }
  }

  try {
    await salvarArquivoLocal(documentoId, file);
    return {
      storagePath: null,
      storageBucket: null,
      localFileId: documentoId,
      remoto: false,
      erro: erros.join(" | ") || "Arquivo salvo somente neste dispositivo",
    };
  } catch {
    throw new Error(erros.join(" | ") || "Não foi possível salvar o arquivo");
  }
}

export async function obterArquivoDocumento(documento: DocumentoRH): Promise<Blob> {
  if (documento.storagePath) {
    const buckets = documento.storageBucket
      ? [documento.storageBucket, ...DOCUMENT_READ_BUCKETS.filter((item) => item !== documento.storageBucket)]
      : [...DOCUMENT_READ_BUCKETS];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.from(bucket).download(documento.storagePath);
      if (!error && data) return data;
    }
  }
  if (documento.localFileId) {
    const data = await obterArquivoLocal(documento.localFileId);
    if (data) return data;
  }
  throw new Error("Arquivo não encontrado ou sem permissão de acesso");
}

export async function excluirArquivoDocumento(documento: DocumentoRH) {
  if (documento.storagePath) {
    const buckets = documento.storageBucket ? [documento.storageBucket] : [...DOCUMENT_READ_BUCKETS];
    await Promise.allSettled(buckets.map((bucket) => supabase.storage.from(bucket).remove([documento.storagePath!])));
  }
  if (documento.localFileId) {
    await removerArquivoLocal(documento.localFileId);
  }
}

const TIPOS_EXIGEM_DETALHES = new Set([
  "orientacao_verbal",
  "ajuste_conduta",
  "advertencia",
  "suspensao",
  "recusa_assinatura",
  "dispensa_justa",
  "devolucao_bens",
  "plano_melhoria",
]);

export function documentoExigeDetalhes(tipoId: string) {
  return TIPOS_EXIGEM_DETALHES.has(tipoId);
}

export function statusDocumento(documento: DocumentoRH, hoje = new Date()): StatusDocumento {
  if (documento.arquivado) return "arquivado";
  if (!documento.dataVencimento) return "sem_vencimento";
  const vencimento = new Date(`${documento.dataVencimento}T23:59:59`);
  const diff = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86_400_000);
  if (diff < 0) return "vencido";
  if (diff <= 30) return "vencendo";
  return "valido";
}

export function formatarTamanho(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function criarIdDocumento() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sugerirVencimento(dataDocumento: string, tipo: TipoDocumento | undefined) {
  if (!dataDocumento || !tipo?.validadeDias) return "";
  const data = new Date(`${dataDocumento}T12:00:00`);
  data.setDate(data.getDate() + tipo.validadeDias);
  return data.toISOString().slice(0, 10);
}

function dataBr(value?: string | null) {
  if (!value) return "____/____/________";
  const [ano, mes, dia] = value.split("-");
  return `${dia}/${mes}/${ano}`;
}

function textoModelo(documento: DocumentoRH, funcionario?: FuncionarioDocumento | null) {
  const nome = funcionario?.nome ?? "____________________________________________";
  const cargo = funcionario?.cargo ?? "____________________________";
  const data = dataBr(documento.dataDocumento);
  const obs = documento.observacoes.trim() || "________________________________________________________________________________";

  const textos: Record<string, string[]> = {
    orientacao_verbal: [
      `REGISTRO DE ORIENTAÇÃO VERBAL`,
      `Na data de ${data}, o(a) empregado(a) ${nome}, cargo ${cargo}, recebeu orientação verbal referente ao seguinte fato:`,
      obs,
      `Foram esclarecidas as regras aplicáveis e as providências esperadas para evitar nova ocorrência. Este registro tem finalidade de acompanhamento interno e não substitui a análise individual do caso.`,
    ],
    ajuste_conduta: [
      `TERMO DE AJUSTE DE CONDUTA`,
      `EMPREGADO(A): ${nome} | CARGO: ${cargo}`,
      `FATO/CONDUTA A SER AJUSTADA: ${obs}`,
      `COMPROMISSOS: o(a) empregado(a) declara estar ciente das orientações recebidas e compromete-se a adequar sua conduta às normas internas, ao contrato de trabalho e às instruções legítimas da empresa.`,
      `ACOMPANHAMENTO: as partes poderão registrar orientações, treinamentos e resultados durante o período definido pela gestão.`,
    ],
    advertencia: [
      `ADVERTÊNCIA DISCIPLINAR`,
      `Ao(À) empregado(a) ${nome}, cargo ${cargo}.`,
      `Fica registrada advertência em razão do seguinte fato ocorrido ou apurado: ${obs}`,
      `O(A) empregado(a) é orientado(a) a observar as normas internas, as obrigações contratuais e as instruções relacionadas ao trabalho. A repetição de condutas poderá ser avaliada conforme a gravidade, proporcionalidade e circunstâncias do caso.`,
    ],
    suspensao: [
      `SUSPENSÃO DISCIPLINAR`,
      `Ao(À) empregado(a) ${nome}, cargo ${cargo}.`,
      `Em razão do fato a seguir descrito, comunica-se a suspensão disciplinar pelo período informado neste documento: ${obs}`,
      `A medida deve observar imediatidade, proporcionalidade, singularidade da punição e análise individual. Informar no campo de observações as datas de início e fim da suspensão.`,
    ],
    recusa_assinatura: [
      `TERMO DE RECUSA DE ASSINATURA`,
      `Declara-se que o documento identificado como “${documento.titulo}” foi apresentado ao(à) empregado(a) ${nome} em ${data}, que optou por não assiná-lo.`,
      `O conteúdo foi lido ou disponibilizado para leitura, ficando o fato registrado na presença das testemunhas abaixo.`,
      obs,
    ],
    pedido_demissao: [
      `PEDIDO DE DEMISSÃO`,
      `À EMPRESA`,
      `Eu, ${nome}, ocupante do cargo ${cargo}, solicito meu desligamento do quadro de empregados por iniciativa própria, a partir da data indicada neste documento.`,
      `Solicito que sejam adotadas as providências legais e contratuais cabíveis quanto ao aviso-prévio e ao pagamento das verbas devidas.`,
      obs,
    ],
    dispensa_sem_justa: [
      `COMUNICADO DE DISPENSA SEM JUSTA CAUSA`,
      `Ao(À) empregado(a) ${nome}, cargo ${cargo}.`,
      `A empresa comunica a extinção do contrato de trabalho sem justa causa, na data informada, com adoção das providências relativas ao aviso-prévio, verbas rescisórias, FGTS e demais documentos aplicáveis.`,
      obs,
    ],
    dispensa_justa: [
      `COMUNICADO DE DISPENSA POR JUSTA CAUSA`,
      `Ao(À) empregado(a) ${nome}, cargo ${cargo}.`,
      `A empresa comunica a extinção do contrato por justa causa em razão dos fatos especificamente descritos a seguir: ${obs}`,
      `A utilização deste modelo exige validação jurídica prévia, documentação das evidências e enquadramento legal adequado ao caso concreto.`,
    ],
    acordo_484a: [
      `TERMO DE EXTINÇÃO DO CONTRATO POR ACORDO`,
      `EMPREGADO(A): ${nome} | CARGO: ${cargo}`,
      `As partes manifestam interesse na extinção do contrato por acordo, observadas as verbas, limites, movimentação do FGTS e demais efeitos previstos na legislação.`,
      `A manifestação deve ser livre, sem coação, e o cálculo rescisório deve ser conferido pela contabilidade ou assessoria responsável.`,
      obs,
    ],
    termino_experiencia: [
      `COMUNICADO DE TÉRMINO DO CONTRATO DE EXPERIÊNCIA`,
      `Ao(À) empregado(a) ${nome}.`,
      `Comunicamos o encerramento do contrato de experiência na data prevista, devendo ser providenciados o exame demissional quando aplicável, o pagamento das verbas e os registros correspondentes.`,
      obs,
    ],
    devolucao_bens: [
      `TERMO DE DEVOLUÇÃO DE BENS E ACESSOS`,
      `EMPREGADO(A): ${nome} | CARGO: ${cargo}`,
      `Registrar os itens devolvidos, estado de conservação, chaves, uniformes, crachás, equipamentos, documentos, senhas e acessos revogados:`,
      obs,
    ],
    plano_melhoria: [
      `PLANO DE MELHORIA DE DESEMPENHO`,
      `EMPREGADO(A): ${nome} | CARGO: ${cargo}`,
      `PONTOS DE MELHORIA: ${obs}`,
      `METAS E CRITÉRIOS: definir resultados objetivos, apoio disponibilizado, responsáveis, prazos e datas de acompanhamento.`,
    ],
  };

  return textos[documento.tipoId] ?? [
    documento.titulo.toUpperCase(),
    `EMPREGADO(A): ${nome}`,
    `CARGO: ${cargo}`,
    `DATA DO DOCUMENTO: ${data}`,
    obs,
  ];
}

function montarModeloPdf(
  documento: DocumentoRH,
  empresa: EmpresaDocumento | null,
  funcionario?: FuncionarioDocumento | null,
) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const largura = 210;
  const margem = 18;
  let y = 18;

  const empresaNome = empresa?.razao_social || empresa?.nome_fantasia || "EMPRESA";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(String(empresaNome).toUpperCase(), margem, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (empresa?.cnpj) {
    pdf.text(`CNPJ: ${empresa.cnpj}`, margem, y);
    y += 5;
  }
  if (empresa?.endereco) {
    const endereco = pdf.splitTextToSize(`Endereço: ${empresa.endereco}`, largura - margem * 2);
    pdf.text(endereco, margem, y);
    y += endereco.length * 4 + 2;
  }
  pdf.setDrawColor(80);
  pdf.line(margem, y, largura - margem, y);
  y += 7;

  if (funcionario) {
    const matricula = funcionario.matricula?.trim() || "NÃO INFORMADA";
    const identificacao = [
      `EMPREGADO(A): ${funcionario.nome}`,
      `MATRÍCULA: ${matricula}`,
      `CARGO: ${funcionario.cargo?.trim() || "NÃO INFORMADO"}`,
      funcionario.cpf ? `CPF: ${funcionario.cpf}` : null,
      funcionario.data_admissao ? `ADMISSÃO: ${dataBr(funcionario.data_admissao)}` : null,
    ].filter(Boolean) as string[];

    pdf.setFillColor(247, 247, 247);
    const caixaAltura = 7 + identificacao.length * 4.5;
    pdf.roundedRect(margem, y, largura - margem * 2, caixaAltura, 1.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    identificacao.forEach((linha, index) => pdf.text(linha, margem + 4, y + 6 + index * 4.5));
    y += caixaAltura + 8;
  } else {
    y += 3;
  }

  const blocos = textoModelo(documento, funcionario);
  blocos.forEach((bloco, index) => {
    const titulo = index === 0;
    pdf.setFont("helvetica", titulo ? "bold" : "normal");
    pdf.setFontSize(titulo ? 14 : 10.5);
    const linhas = pdf.splitTextToSize(bloco, largura - margem * 2);
    if (y + linhas.length * 5 > 265) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(linhas, titulo ? largura / 2 : margem, y, titulo ? { align: "center" } : undefined);
    y += linhas.length * (titulo ? 6 : 5) + (titulo ? 5 : 4);
  });

  const alturaPagina = 297;
  const alturaAssinaturas = 48;
  if (y + alturaAssinaturas > 274) {
    pdf.addPage();
    y = 55;
  } else {
    y = Math.max(y + 16, 210);
  }

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0);
  pdf.line(margem, y, 92, y);
  pdf.line(118, y, largura - margem, y);
  pdf.text(funcionario?.nome ?? "Empregado(a)", 55, y + 5, { align: "center", maxWidth: 72 });
  pdf.text(empresa?.responsavel ?? "Representante da empresa", 155, y + 5, { align: "center", maxWidth: 72 });
  if (funcionario?.matricula) {
    pdf.setFontSize(7.5);
    pdf.text(`Matrícula: ${funcionario.matricula}`, 55, y + 9, { align: "center" });
  }
  y += 24;
  pdf.setFontSize(9);
  pdf.line(margem, y, 92, y);
  pdf.line(118, y, largura - margem, y);
  pdf.text("Testemunha 1", 55, y + 5, { align: "center" });
  pdf.text("Testemunha 2", 155, y + 5, { align: "center" });

  const totalPaginas = pdf.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.2);
    pdf.setTextColor(100);
    pdf.text(`Página ${pagina} de ${totalPaginas}`, largura - margem, alturaPagina - 6, { align: "right" });
  }
  pdf.setPage(totalPaginas);
  pdf.setFontSize(7.2);
  pdf.setTextColor(90);
  const rodape = pdf.splitTextToSize(
    "Modelo administrativo. A aplicação e o conteúdo devem ser conferidos pela contabilidade, medicina do trabalho ou assessoria jurídica conforme o caso concreto.",
    largura - margem * 2 - 28,
  );
  pdf.text(rodape, largura / 2, alturaPagina - 16, { align: "center" });

  pdf.setProperties({
    title: documento.titulo,
    subject: documento.tipoNome,
    author: String(empresaNome),
    creator: "Turbo Ponto",
  });

  const identificador = funcionario?.matricula?.trim() || funcionario?.nome || "empresa";
  const nomeArquivo = nomeSeguro(`${identificador}-${documento.titulo}-${documento.dataDocumento}.pdf`);
  return { pdf, nomeArquivo };
}

export function gerarModeloPdfArquivo(
  documento: DocumentoRH,
  empresa: EmpresaDocumento | null,
  funcionario?: FuncionarioDocumento | null,
) {
  const { pdf, nomeArquivo } = montarModeloPdf(documento, empresa, funcionario);
  const blob = pdf.output("blob");
  return new File([blob], nomeArquivo, { type: "application/pdf", lastModified: Date.now() });
}

export function gerarModeloPdf(
  documento: DocumentoRH,
  empresa: EmpresaDocumento | null,
  funcionario?: FuncionarioDocumento | null,
) {
  const { pdf, nomeArquivo } = montarModeloPdf(documento, empresa, funcionario);
  pdf.save(nomeArquivo);
}
