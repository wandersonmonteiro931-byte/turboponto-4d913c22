import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderArchive,
  HeartPulse,
  MoreHorizontal,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  CATALOGO_DOCUMENTOS,
  CATEGORIAS_DOCUMENTOS,
  carregarDocumentos,
  criarIdDocumento,
  documentoExigeDetalhes,
  excluirArquivoDocumento,
  formatarTamanho,
  gerarModeloPdf,
  gerarModeloPdfArquivo,
  obterArquivoDocumento,
  salvarDocumentos,
  statusDocumento,
  sugerirVencimento,
  enviarArquivoDocumento,
  type AssinaturaDocumento,
  type DocumentoRH,
  type EmpresaDocumento,
  type EscopoDocumento,
  type FuncionarioDocumento,
  type StatusDocumento,
  type TipoDocumento,
} from "@/lib/documentacao";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/empresa/documentacao")({
  component: DocumentacaoPage,
});

const statusConfig: Record<StatusDocumento, { label: string; className: string }> = {
  valido: { label: "Válido", className: "bg-green-100 text-green-800 border-green-200" },
  vencendo: { label: "Vence em até 30 dias", className: "bg-amber-100 text-amber-800 border-amber-200" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-800 border-red-200" },
  sem_vencimento: { label: "Sem vencimento", className: "bg-slate-100 text-slate-700 border-slate-200" },
  arquivado: { label: "Arquivado", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

const obrigatoriedadeLabel = {
  obrigatorio: "Obrigatório em regra",
  quando_aplicavel: "Quando aplicável",
  recomendado: "Controle recomendado",
};

const processoCards = [
  {
    titulo: "Admissão",
    descricao: "Cadastro, contrato, ASO, eSocial, benefícios e termos iniciais.",
    categoria: "Admissão e cadastro",
    icone: Users,
    destaque: "ficha_registro",
  },
  {
    titulo: "Contratos e alterações",
    descricao: "Contratos, aditivos, jornada, cargo, salário, transferência e teletrabalho.",
    categoria: "Contratos e alterações",
    icone: BriefcaseBusiness,
    destaque: "contrato_indeterminado",
  },
  {
    titulo: "Medidas disciplinares",
    descricao: "Orientação, ajuste de conduta, advertência, suspensão e apuração.",
    categoria: "Medidas disciplinares",
    icone: ShieldAlert,
    destaque: "advertencia",
  },
  {
    titulo: "Desligamento",
    descricao: "Tipos de rescisão, aviso-prévio, TRCT, eSocial, FGTS e devoluções.",
    categoria: "Desligamento",
    icone: FolderArchive,
    destaque: "dispensa_sem_justa",
  },
  {
    titulo: "Saúde e segurança",
    descricao: "ASO, CAT, PPP, EPI, PGR, PCMSO, LTCAT e treinamentos.",
    categoria: "Saúde e segurança do trabalho",
    icone: HeartPulse,
    destaque: "aso_admissional",
  },
  {
    titulo: "Empresa e conformidade",
    descricao: "Licenças, instrumentos coletivos, DET, ponto, auditorias e políticas.",
    categoria: "Empresa e conformidade",
    icone: Building2,
    destaque: "cartao_cnpj",
  },
] as const;

function DocumentacaoPage() {
  const { empresaId, role, nome } = useAuth();
  const podeEditar = role === "admin" || role === "gerente";
  const [documentos, setDocumentos] = useState<DocumentoRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioDocumento[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaDocumento | null>(null);
  const [loading, setLoading] = useState(true);
  const [sincronizado, setSincronizado] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [funcionarioId, setFuncionarioId] = useState("todos");
  const [escopo, setEscopo] = useState("todos");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editando, setEditando] = useState<DocumentoRH | null>(null);
  const [tipoInicial, setTipoInicial] = useState<string | null>(null);
  const [catalogoBusca, setCatalogoBusca] = useState("");
  const [catalogoCategoria, setCatalogoCategoria] = useState("todas");
  const [aba, setAba] = useState("arquivo");
  const [preview, setPreview] = useState<{ url: string; nome: string; tipo: string } | null>(null);

  const carregar = async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: funcs }, { data: emp }, docs] = await Promise.all([
      supabase
        .from("funcionarios")
        .select("id,nome,cpf,rg,cargo,matricula,data_admissao,data_desligamento,endereco")
        .eq("empresa_id", empresaId)
        .order("nome"),
      supabase
        .from("empresas")
        .select("nome_fantasia,razao_social,cnpj,endereco,responsavel")
        .eq("id", empresaId)
        .maybeSingle(),
      carregarDocumentos(empresaId),
    ]);
    setFuncionarios((funcs ?? []) as FuncionarioDocumento[]);
    setEmpresa((emp ?? null) as EmpresaDocumento | null);

    let documentosCarregados = docs.documentos;
    let remoto = docs.remoto;

    // Migra automaticamente arquivos que a versão anterior deixou apenas no navegador.
    if (podeEditar && documentosCarregados.some((doc) => !!doc.localFileId && !doc.storagePath)) {
      let houveMigracao = false;
      const migrados: DocumentoRH[] = [];
      for (const documento of documentosCarregados) {
        if (!documento.localFileId || documento.storagePath) {
          migrados.push(documento);
          continue;
        }
        try {
          const blob = await obterArquivoDocumento(documento);
          const arquivo = new File(
            [blob],
            documento.arquivoNome || `${documento.titulo}.pdf`,
            { type: documento.arquivoTipo || blob.type || "application/octet-stream" },
          );
          const envio = await enviarArquivoDocumento(empresaId, documento.id, arquivo, documento.funcionarioId);
          if (envio.remoto) {
            houveMigracao = true;
            migrados.push({
              ...documento,
              storagePath: envio.storagePath,
              storageBucket: envio.storageBucket,
              localFileId: null,
              atualizadoEm: new Date().toISOString(),
            });
            continue;
          }
        } catch (error) {
          console.warn("[documentacao] arquivo local ainda não sincronizado", error);
        }
        migrados.push(documento);
      }
      documentosCarregados = migrados;
      if (houveMigracao) {
        const resultadoMigracao = await salvarDocumentos(empresaId, documentosCarregados);
        remoto = resultadoMigracao.remoto;
      }
    }

    setDocumentos(documentosCarregados);
    setSincronizado(remoto);

    const queryFuncionario = new URLSearchParams(window.location.search).get("funcionario");
    if (queryFuncionario && (funcs ?? []).some((item) => item.id === queryFuncionario)) {
      setFuncionarioId(queryFuncionario);
    }
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const persistir = async (proximos: DocumentoRH[], mensagem: string) => {
    if (!empresaId) return;
    setDocumentos(proximos);
    const resultado = await salvarDocumentos(empresaId, proximos);
    setSincronizado(resultado.remoto);
    if (resultado.remoto) toast.success(mensagem);
    else toast.warning(`${mensagem}. Os dados ficaram salvos neste navegador, mas não sincronizaram com o armazenamento da empresa.`);
  };

  const abrirNovo = (tipoId?: string, funcId?: string) => {
    setEditando(null);
    setTipoInicial(tipoId ?? null);
    if (funcId) setFuncionarioId(funcId);
    setEditorOpen(true);
  };

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return documentos
      .filter((doc) => categoria === "todas" || doc.categoria === categoria)
      .filter((doc) => status === "todos" || statusDocumento(doc) === status)
      .filter((doc) => funcionarioId === "todos" || doc.funcionarioId === funcionarioId)
      .filter((doc) => escopo === "todos" || doc.escopo === escopo)
      .filter((doc) => {
        if (!termo) return true;
        const funcionario = funcionarios.find((item) => item.id === doc.funcionarioId)?.nome ?? "";
        return [doc.titulo, doc.tipoNome, doc.categoria, doc.responsavel, doc.observacoes, funcionario]
          .join(" ")
          .toLowerCase()
          .includes(termo);
      })
      .sort((a, b) => b.dataDocumento.localeCompare(a.dataDocumento));
  }, [busca, categoria, documentos, escopo, funcionarioId, funcionarios, status]);

  const catalogoFiltrado = useMemo(() => {
    const termo = catalogoBusca.trim().toLowerCase();
    return CATALOGO_DOCUMENTOS.filter((tipo) => catalogoCategoria === "todas" || tipo.categoria === catalogoCategoria).filter(
      (tipo) => !termo || `${tipo.nome} ${tipo.descricao} ${tipo.categoria}`.toLowerCase().includes(termo),
    );
  }, [catalogoBusca, catalogoCategoria]);

  const resumo = useMemo(() => {
    const statuses = documentos.map((doc) => statusDocumento(doc));
    return {
      total: documentos.length,
      funcionario: documentos.filter((doc) => doc.escopo === "funcionario").length,
      empresa: documentos.filter((doc) => doc.escopo === "empresa").length,
      vencendo: statuses.filter((item) => item === "vencendo").length,
      vencido: statuses.filter((item) => item === "vencido").length,
      assinatura: documentos.filter((doc) => doc.assinatura === "pendente").length,
    };
  }, [documentos]);

  const baixarBlob = (blob: Blob, nomeArquivo: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  const fecharPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const abrirArquivo = async (documento: DocumentoRH, baixar = false) => {
    try {
      const blob = await obterArquivoDocumento(documento);
      const nomeArquivo = documento.arquivoNome ?? `${documento.titulo}.pdf`;
      if (baixar) {
        baixarBlob(blob, nomeArquivo);
        return;
      }

      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({
        url: URL.createObjectURL(blob),
        nome: nomeArquivo,
        tipo: documento.arquivoTipo || blob.type || "application/octet-stream",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o arquivo");
    }
  };

  const gerarModelo = (documento: DocumentoRH) => {
    const funcionario = funcionarios.find((item) => item.id === documento.funcionarioId) ?? null;
    gerarModeloPdf(documento, empresa, funcionario);
  };

  const alternarArquivo = async (documento: DocumentoRH) => {
    const proximos = documentos.map((item) =>
      item.id === documento.id ? { ...item, arquivado: !item.arquivado, atualizadoEm: new Date().toISOString() } : item,
    );
    await persistir(proximos, documento.arquivado ? "Documento restaurado" : "Documento arquivado");
  };

  const excluir = async (documento: DocumentoRH) => {
    if (!confirm(`Excluir definitivamente “${documento.titulo}”?`)) return;
    try {
      await excluirArquivoDocumento(documento);
    } catch (error) {
      console.warn("Não foi possível remover o anexo", error);
    }
    await persistir(
      documentos.filter((item) => item.id !== documento.id),
      "Documento excluído",
    );
  };

  if (!empresaId) {
    return <p className="text-sm text-muted-foreground">Cadastre primeiro os dados da empresa.</p>;
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando documentação...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderArchive className="h-6 w-6" /> Documentação
          </h2>
          <p className="text-sm text-muted-foreground">
            Arquivo trabalhista de funcionários e da empresa, com documentos admissionais, contratuais, disciplinares,
            rescisórios e de saúde e segurança.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={() => abrirNovo()}>
            <FilePlus2 className="h-4 w-4 mr-2" /> Novo documento
          </Button>
        )}
      </div>

      {!sincronizado && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sincronização temporariamente indisponível</AlertTitle>
          <AlertDescription>
            O registro foi preservado neste dispositivo. Tente salvar novamente quando a conexão com o armazenamento do sistema estiver disponível.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <BookOpenCheck className="h-4 w-4" />
        <AlertTitle>Catálogo de controle trabalhista</AlertTitle>
        <AlertDescription>
          A obrigatoriedade de cada documento depende do tipo de contrato, atividade, riscos, porte, normas coletivas e
          situação concreta. O sistema organiza e gera modelos administrativos, mas não substitui a contabilidade, a
          medicina do trabalho ou a análise jurídica.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <ResumoCard titulo="Documentos" valor={resumo.total} icone={FileText} />
        <ResumoCard titulo="Funcionários" valor={resumo.funcionario} icone={UserRound} />
        <ResumoCard titulo="Empresa" valor={resumo.empresa} icone={Building2} />
        <ResumoCard titulo="Vencendo" valor={resumo.vencendo} icone={CalendarClock} />
        <ResumoCard titulo="Vencidos" valor={resumo.vencido} icone={AlertTriangle} />
        <ResumoCard titulo="Assinatura" valor={resumo.assinatura} icone={FileCheck2} />
      </div>

      {podeEditar && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações rápidas</CardTitle>
            <CardDescription>Crie os registros mais usados sem procurar no catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => abrirNovo("ajuste_conduta")}>
              Ajuste de conduta
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("advertencia")}>
              Advertência
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("suspensao")}>
              Suspensão
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("contrato_experiencia")}>
              Contrato de experiência
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("aso_admissional")}>
              ASO admissional
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("pedido_demissao")}>
              Pedido de demissão
            </Button>
            <Button variant="outline" onClick={() => abrirNovo("dispensa_sem_justa")}>
              Dispensa sem justa causa
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={aba} onValueChange={setAba} className="space-y-4">
        <TabsList className="h-auto flex flex-wrap justify-start">
          <TabsTrigger value="arquivo">Arquivo</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo de documentos</TabsTrigger>
          <TabsTrigger value="funcionarios">Pastas por funcionário</TabsTrigger>
        </TabsList>

        <TabsContent value="arquivo" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar documento, funcionário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
              <FiltroSelect value={escopo} onChange={setEscopo} ariaLabel="Escopo">
                <option value="todos">Todos os arquivos</option>
                <option value="funcionario">Funcionários</option>
                <option value="empresa">Empresa</option>
              </FiltroSelect>
              <FiltroSelect value={funcionarioId} onChange={setFuncionarioId} ariaLabel="Funcionário">
                <option value="todos">Todos os funcionários</option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </option>
                ))}
              </FiltroSelect>
              <FiltroSelect value={categoria} onChange={setCategoria} ariaLabel="Categoria">
                <option value="todas">Todas as categorias</option>
                {CATEGORIAS_DOCUMENTOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </FiltroSelect>
              <FiltroSelect value={status} onChange={setStatus} ariaLabel="Status">
                <option value="todos">Todos os status</option>
                {Object.entries(statusConfig).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </FiltroSelect>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filtrados.length === 0 ? (
                <div className="p-10 text-center">
                  <FolderArchive className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum documento encontrado.</p>
                  {podeEditar && (
                    <Button className="mt-4" variant="outline" onClick={() => abrirNovo()}>
                      Cadastrar documento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[940px] text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3 text-left">Documento</th>
                        <th className="p-3 text-left">Funcionário/empresa</th>
                        <th className="p-3 text-left">Data</th>
                        <th className="p-3 text-left">Vencimento</th>
                        <th className="p-3 text-left">Assinatura</th>
                        <th className="p-3 text-left">Arquivo</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtrados.map((documento) => {
                        const situacao = statusDocumento(documento);
                        const funcionario = funcionarios.find((item) => item.id === documento.funcionarioId);
                        const tipo = CATALOGO_DOCUMENTOS.find((item) => item.id === documento.tipoId);
                        return (
                          <tr key={documento.id} className="align-top hover:bg-muted/25">
                            <td className="p-3 max-w-[320px]">
                              <div className="font-medium">{documento.titulo}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{documento.categoria}</div>
                              {documento.observacoes && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{documento.observacoes}</div>
                              )}
                            </td>
                            <td className="p-3">
                              {documento.escopo === "empresa" ? (
                                <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Empresa</span>
                              ) : (
                                <div>
                                  <div className="inline-flex items-center gap-1 font-medium"><UserRound className="h-3.5 w-3.5" /> {funcionario?.nome ?? "Funcionário removido"}</div>
                                  {funcionario?.cargo && <div className="text-xs text-muted-foreground">{funcionario.cargo}</div>}
                                </div>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">{dataPt(documento.dataDocumento)}</td>
                            <td className="p-3 whitespace-nowrap">
                              <Badge variant="outline" className={statusConfig[situacao].className}>{statusConfig[situacao].label}</Badge>
                              {documento.dataVencimento && <div className="text-xs mt-1">{dataPt(documento.dataVencimento)}</div>}
                            </td>
                            <td className="p-3 capitalize">{assinaturaPt(documento.assinatura)}</td>
                            <td className="p-3 max-w-[180px]">
                              {documento.arquivoNome ? (
                                <div>
                                  <button className="text-left text-primary hover:underline truncate max-w-[170px] block" onClick={() => void abrirArquivo(documento)}>{documento.arquivoNome}</button>
                                  <div className="text-xs text-muted-foreground">{formatarTamanho(documento.arquivoTamanho)}</div>
                                </div>
                              ) : tipo?.modelo ? (
                                <span className="text-xs text-muted-foreground">Modelo disponível</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Sem anexo</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {documento.arquivoNome && (
                                    <>
                                      <DropdownMenuItem onClick={() => void abrirArquivo(documento)}><Eye className="h-4 w-4 mr-2" /> Abrir anexo</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => void abrirArquivo(documento, true)}><Download className="h-4 w-4 mr-2" /> Baixar anexo</DropdownMenuItem>
                                    </>
                                  )}
                                  {tipo?.modelo && <DropdownMenuItem onClick={() => gerarModelo(documento)}><FileText className="h-4 w-4 mr-2" /> Gerar modelo em PDF</DropdownMenuItem>}
                                  {podeEditar && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => { setEditando(documento); setTipoInicial(documento.tipoId); setEditorOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => void alternarArquivo(documento)}><Archive className="h-4 w-4 mr-2" /> {documento.arquivado ? "Restaurar" : "Arquivar"}</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => void excluir(documento)}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processos">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processoCards.map((processo) => {
              const Icone = processo.icone;
              const tipos = CATALOGO_DOCUMENTOS.filter((item) => item.categoria === processo.categoria);
              const cadastrados = documentos.filter((item) => item.categoria === processo.categoria).length;
              return (
                <Card key={processo.titulo}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2"><Icone className="h-5 w-5" /></div>
                      <Badge variant="secondary">{tipos.length} tipos</Badge>
                    </div>
                    <CardTitle className="text-lg">{processo.titulo}</CardTitle>
                    <CardDescription>{processo.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm"><strong>{cadastrados}</strong> documento(s) cadastrado(s)</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setCatalogoCategoria(processo.categoria); setAba("catalogo"); }}>Ver catálogo</Button>
                      {podeEditar && <Button size="sm" onClick={() => abrirNovo(processo.destaque)}>Novo</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar tipo de documento" value={catalogoBusca} onChange={(e) => setCatalogoBusca(e.target.value)} />
              </div>
              <FiltroSelect value={catalogoCategoria} onChange={setCatalogoCategoria} ariaLabel="Categoria do catálogo">
                <option value="todas">Todas as categorias</option>
                {CATEGORIAS_DOCUMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
              </FiltroSelect>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {catalogoFiltrado.map((tipo) => (
              <Card key={tipo.id}>
                <CardContent className="p-4 flex gap-3">
                  <div className="rounded-lg bg-muted p-2 h-fit"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{tipo.nome}</h3>
                        <p className="text-xs text-muted-foreground">{tipo.categoria}</p>
                      </div>
                      <Badge variant="outline">{obrigatoriedadeLabel[tipo.obrigatoriedade]}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{tipo.descricao}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Escopo: {tipo.escopo === "ambos" ? "funcionário ou empresa" : tipo.escopo}</span>
                      {tipo.modelo && <Badge variant="secondary">Gera modelo PDF</Badge>}
                      {tipo.validadeDias && <Badge variant="secondary">Vencimento sugerido</Badge>}
                    </div>
                    {podeEditar && <Button className="mt-3" size="sm" variant="outline" onClick={() => abrirNovo(tipo.id)}><FilePlus2 className="h-3.5 w-3.5 mr-1" /> Cadastrar</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="funcionarios">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {funcionarios.map((funcionario) => {
              const docs = documentos.filter((item) => item.funcionarioId === funcionario.id);
              const pendencias = docs.filter((item) => ["vencendo", "vencido"].includes(statusDocumento(item))).length;
              return (
                <Card key={funcionario.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2"><UserRound className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{funcionario.nome}</CardTitle>
                        <CardDescription>{funcionario.cargo || "Cargo não informado"}{funcionario.matricula ? ` · ${funcionario.matricula}` : ""}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span>{docs.length} documento(s)</span>
                      {pendencias > 0 ? <Badge className="bg-amber-100 text-amber-900">{pendencias} atenção</Badge> : <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Em dia</Badge>}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setFuncionarioId(funcionario.id); setAba("arquivo"); }}>Abrir pasta</Button>
                      {podeEditar && <Button size="sm" onClick={() => abrirNovo(undefined, funcionario.id)}>Novo documento</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {preview && (
        <Dialog open onOpenChange={(open) => !open && fecharPreview()}>
          <DialogContent className="max-w-[96vw] w-[1100px] h-[92vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="border-b px-5 py-3">
              <div className="flex items-center justify-between gap-3 pr-8">
                <DialogTitle className="truncate text-base">{preview.nome}</DialogTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const resposta = await fetch(preview.url);
                    baixarBlob(await resposta.blob(), preview.nome);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Baixar
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 bg-muted/30">
              {preview.tipo.includes("pdf") ? (
                <iframe title={preview.nome} src={`${preview.url}#page=1&zoom=page-width`} className="h-full w-full border-0" />
              ) : preview.tipo.startsWith("image/") ? (
                <div className="flex h-full items-center justify-center overflow-auto p-4">
                  <img src={preview.url} alt={preview.nome} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Este tipo de arquivo não possui visualização no navegador.</p>
                  <Button onClick={async () => { const resposta = await fetch(preview.url); baixarBlob(await resposta.blob(), preview.nome); }}>
                    <Download className="mr-2 h-4 w-4" /> Baixar arquivo
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editorOpen && (
        <DocumentoEditor
          empresaId={empresaId}
          funcionarios={funcionarios}
          empresa={empresa}
          documento={editando}
          tipoInicial={tipoInicial}
          responsavelPadrao={nome}
          funcionarioInicial={funcionarioId !== "todos" ? funcionarioId : null}
          onClose={() => { setEditorOpen(false); setEditando(null); setTipoInicial(null); }}
          onSave={async (documento, arquivo, arquivoAnterior) => {
            let final = documento;
            if (arquivo) {
              const envio = await enviarArquivoDocumento(empresaId, documento.id, arquivo, documento.funcionarioId);
              if (
                arquivoAnterior &&
                ((arquivoAnterior.storagePath && arquivoAnterior.storagePath !== envio.storagePath) ||
                  (arquivoAnterior.localFileId && arquivoAnterior.localFileId !== envio.localFileId))
              ) {
                try { await excluirArquivoDocumento(arquivoAnterior); } catch { /* mantém o novo arquivo */ }
              }
              final = {
                ...documento,
                arquivoNome: arquivo.name,
                arquivoTipo: arquivo.type || null,
                arquivoTamanho: arquivo.size,
                storagePath: envio.storagePath,
                storageBucket: envio.storageBucket,
                localFileId: envio.localFileId,
              };
            }
            const existe = documentos.some((item) => item.id === final.id);
            const proximos = existe ? documentos.map((item) => item.id === final.id ? final : item) : [final, ...documentos];
            await persistir(proximos, existe ? "Documento atualizado" : "Documento cadastrado");
            setEditorOpen(false);
            setEditando(null);
            setTipoInicial(null);
          }}
        />
      )}
    </div>
  );
}

function DocumentoEditor({
  empresaId,
  funcionarios,
  empresa,
  documento,
  tipoInicial,
  responsavelPadrao,
  funcionarioInicial,
  onClose,
  onSave,
}: {
  empresaId: string;
  funcionarios: FuncionarioDocumento[];
  empresa: EmpresaDocumento | null;
  documento: DocumentoRH | null;
  tipoInicial: string | null;
  responsavelPadrao: string;
  funcionarioInicial: string | null;
  onClose: () => void;
  onSave: (documento: DocumentoRH, arquivo: File | null, arquivoAnterior: DocumentoRH | null) => Promise<void>;
}) {
  const tipoInicialObj = CATALOGO_DOCUMENTOS.find((item) => item.id === (documento?.tipoId ?? tipoInicial)) ?? CATALOGO_DOCUMENTOS[0];
  const escopoInicial: EscopoDocumento = documento?.escopo ?? (tipoInicialObj.escopo === "empresa" ? "empresa" : "funcionario");
  const hoje = new Date().toISOString().slice(0, 10);
  const [escopo, setEscopo] = useState<EscopoDocumento>(escopoInicial);
  const [tipoId, setTipoId] = useState(documento?.tipoId ?? tipoInicialObj.id);
  const [funcionarioId, setFuncionarioId] = useState(documento?.funcionarioId ?? funcionarioInicial ?? "");
  const [titulo, setTitulo] = useState(documento?.titulo ?? tipoInicialObj.nome);
  const [dataDocumento, setDataDocumento] = useState(documento?.dataDocumento ?? hoje);
  const [dataVencimento, setDataVencimento] = useState(documento?.dataVencimento ?? sugerirVencimento(hoje, tipoInicialObj));
  const [assinatura, setAssinatura] = useState<AssinaturaDocumento>(documento?.assinatura ?? (tipoInicialObj.modelo ? "pendente" : "nao_aplicavel"));
  const [responsavel, setResponsavel] = useState(documento?.responsavel ?? responsavelPadrao ?? "");
  const [observacoes, setObservacoes] = useState(documento?.observacoes ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [modoArquivo, setModoArquivo] = useState<"gerar_pdf" | "anexar">(
    documento?.origemArquivo === "anexado" ? "anexar" : "gerar_pdf",
  );
  const [salvando, setSalvando] = useState(false);

  const tiposPermitidos = CATALOGO_DOCUMENTOS.filter((tipo) => tipo.escopo === "ambos" || tipo.escopo === escopo);
  const tipo = CATALOGO_DOCUMENTOS.find((item) => item.id === tipoId) ?? tipoInicialObj;
  const funcionarioSelecionado = funcionarios.find((item) => item.id === funcionarioId) ?? null;

  const mudarEscopo = (valor: EscopoDocumento) => {
    setEscopo(valor);
    if (valor === "empresa") setFuncionarioId("");
    const atualPermitido = tipo.escopo === "ambos" || tipo.escopo === valor;
    if (!atualPermitido) {
      const primeiro = CATALOGO_DOCUMENTOS.find((item) => item.escopo === "ambos" || item.escopo === valor);
      if (primeiro) {
        setTipoId(primeiro.id);
        setTitulo(primeiro.nome);
        setDataVencimento(sugerirVencimento(dataDocumento, primeiro));
      }
    }
  };

  const mudarTipo = (id: string) => {
    const novoTipo = CATALOGO_DOCUMENTOS.find((item) => item.id === id);
    if (!novoTipo) return;
    setTipoId(id);
    setTitulo(novoTipo.nome);
    setDataVencimento(sugerirVencimento(dataDocumento, novoTipo));
    if (novoTipo.modelo && assinatura === "nao_aplicavel") setAssinatura("pendente");
  };

  const mudarData = (data: string) => {
    setDataDocumento(data);
    if (!documento?.dataVencimento) setDataVencimento(sugerirVencimento(data, tipo));
  };

  const salvar = async () => {
    if (escopo === "funcionario" && !funcionarioId) return toast.error("Selecione o funcionário");
    if (!titulo.trim()) return toast.error("Informe o título do documento");
    if (!dataDocumento) return toast.error("Informe a data do documento");
    if (modoArquivo === "gerar_pdf" && escopo === "funcionario" && !funcionarioSelecionado?.matricula?.trim()) {
      return toast.error("O funcionário precisa ter matrícula cadastrada para gerar o PDF automaticamente");
    }
    if (modoArquivo === "gerar_pdf" && documentoExigeDetalhes(tipo.id) && !observacoes.trim()) {
      return toast.error("Descreva os fatos, datas e detalhes antes de gerar este documento");
    }
    const anexoExistenteValido = documento?.arquivoNome && documento.origemArquivo === "anexado";
    if (modoArquivo === "anexar" && !arquivo && !anexoExistenteValido) {
      return toast.error("Selecione o arquivo que será anexado");
    }

    setSalvando(true);
    try {
      const agora = new Date().toISOString();
      const novo: DocumentoRH = {
        id: documento?.id ?? criarIdDocumento(),
        empresaId,
        funcionarioId: escopo === "funcionario" ? funcionarioId : null,
        escopo,
        tipoId: tipo.id,
        tipoNome: tipo.nome,
        categoria: tipo.categoria,
        titulo: titulo.trim(),
        dataDocumento,
        dataVencimento: dataVencimento || null,
        assinatura,
        responsavel: responsavel.trim(),
        observacoes: observacoes.trim(),
        arquivado: documento?.arquivado ?? false,
        arquivoNome: documento?.arquivoNome ?? null,
        arquivoTipo: documento?.arquivoTipo ?? null,
        arquivoTamanho: documento?.arquivoTamanho ?? null,
        storagePath: documento?.storagePath ?? null,
        storageBucket: documento?.storageBucket ?? null,
        localFileId: documento?.localFileId ?? null,
        origemArquivo: modoArquivo === "gerar_pdf" ? "gerado_pdf" : "anexado",
        criadoEm: documento?.criadoEm ?? agora,
        atualizadoEm: agora,
      };

      const arquivoParaSalvar = modoArquivo === "gerar_pdf"
        ? gerarModeloPdfArquivo(novo, empresa, escopo === "funcionario" ? funcionarioSelecionado : null)
        : arquivo;

      await onSave(novo, arquivoParaSalvar, documento);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{documento ? "Editar documento" : "Novo documento"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Campo label="Arquivo de">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={escopo} onChange={(e) => mudarEscopo(e.target.value as EscopoDocumento)}>
              <option value="funcionario">Funcionário</option>
              <option value="empresa">Empresa</option>
            </select>
          </Campo>
          {escopo === "funcionario" ? (
            <Campo label="Funcionário *">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
                <option value="">Selecione...</option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}{funcionario.matricula ? ` - MAT. ${funcionario.matricula}` : " - SEM MATRÍCULA"}
                  </option>
                ))}
              </select>
            </Campo>
          ) : <div />}
          {escopo === "funcionario" && funcionarioSelecionado && (
            <div className="md:col-span-2 rounded-lg border bg-muted/30 p-3">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-xs text-muted-foreground block">Funcionário</span><strong>{funcionarioSelecionado.nome}</strong></div>
                <div><span className="text-xs text-muted-foreground block">Matrícula</span><strong className={!funcionarioSelecionado.matricula ? "text-destructive" : ""}>{funcionarioSelecionado.matricula || "Não cadastrada"}</strong></div>
                <div><span className="text-xs text-muted-foreground block">Cargo</span><strong>{funcionarioSelecionado.cargo || "Não informado"}</strong></div>
              </div>
            </div>
          )}
          <Campo label="Tipo de documento *" full>
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={tipoId} onChange={(e) => mudarTipo(e.target.value)}>
              {CATEGORIAS_DOCUMENTOS.map((cat) => {
                const opcoes = tiposPermitidos.filter((item) => item.categoria === cat);
                if (!opcoes.length) return null;
                return <optgroup key={cat} label={cat}>{opcoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</optgroup>;
              })}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{tipo.descricao} · {obrigatoriedadeLabel[tipo.obrigatoriedade]}</p>
          </Campo>
          <Campo label="Título *" full><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></Campo>
          <Campo label="Data do documento *"><Input type="date" value={dataDocumento} onChange={(e) => mudarData(e.target.value)} /></Campo>
          <Campo label="Data de vencimento"><Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} /></Campo>
          <Campo label="Assinatura">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={assinatura} onChange={(e) => setAssinatura(e.target.value as AssinaturaDocumento)}>
              <option value="nao_aplicavel">Não se aplica</option>
              <option value="pendente">Pendente</option>
              <option value="assinado">Assinado</option>
              <option value="recusado">Recusada pelo empregado</option>
            </select>
          </Campo>
          <Campo label="Responsável"><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></Campo>
          <Campo label="Observações, fatos ou detalhes" full><Textarea className="min-h-28" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Descreva fatos, datas, período de suspensão, aviso-prévio, providências, testemunhas ou outros detalhes..." /></Campo>
          <Campo label="Forma do documento *" full>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModoArquivo("gerar_pdf")}
                className={`rounded-lg border p-4 text-left transition ${modoArquivo === "gerar_pdf" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center gap-2 font-semibold"><FileCheck2 className="h-5 w-5" /> Gerar PDF automaticamente</div>
                <p className="mt-1 text-xs text-muted-foreground">Preenche o PDF com empresa, funcionário, matrícula, cargo, data e informações registradas.</p>
              </button>
              <button
                type="button"
                onClick={() => setModoArquivo("anexar")}
                className={`rounded-lg border p-4 text-left transition ${modoArquivo === "anexar" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center gap-2 font-semibold"><Upload className="h-5 w-5" /> Anexar arquivo pronto</div>
                <p className="mt-1 text-xs text-muted-foreground">Permite anexar PDF, imagem, Word ou outro documento já existente.</p>
              </button>
            </div>

            {modoArquivo === "gerar_pdf" ? (
              <div className={`mt-3 rounded-lg border p-3 text-sm ${escopo === "funcionario" && !funcionarioSelecionado?.matricula ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
                {escopo === "funcionario" && !funcionarioSelecionado?.matricula
                  ? "Cadastre a matrícula do funcionário antes de gerar o PDF."
                  : `O PDF será gerado e arquivado automaticamente${funcionarioSelecionado?.matricula ? ` com a matrícula ${funcionarioSelecionado.matricula}` : ""}.`}
              </div>
            ) : (
              <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-center hover:bg-muted/50">
                <Upload className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">{arquivo?.name ?? (documento?.origemArquivo === "anexado" ? documento.arquivoNome : null) ?? "Selecionar PDF, imagem, Word ou outro arquivo"}</span>
                <span className="text-xs text-muted-foreground">O arquivo ficará vinculado ao funcionário e à matrícula selecionados.</span>
                <input type="file" className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </Campo>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void salvar()} disabled={salvando}>{salvando ? "Salvando..." : modoArquivo === "gerar_pdf" ? "Gerar PDF e salvar" : "Anexar e salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResumoCard({ titulo, valor, icone: Icone }: { titulo: string; valor: number; icone: typeof FileText }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{titulo}</p><p className="text-2xl font-bold mt-1">{valor}</p></div><Icone className="h-5 w-5 text-muted-foreground" /></div>
      </CardContent>
    </Card>
  );
}

function FiltroSelect({ value, onChange, ariaLabel, children }: { value: string; onChange: (value: string) => void; ariaLabel: string; children: ReactNode }) {
  return <select aria-label={ariaLabel} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

function Campo({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><Label className="mb-1.5 block text-xs">{label}</Label>{children}</div>;
}

function dataPt(value: string) {
  if (!value) return "—";
  const [ano, mes, dia] = value.split("-");
  return `${dia}/${mes}/${ano}`;
}

function assinaturaPt(value: AssinaturaDocumento) {
  if (value === "nao_aplicavel") return "Não se aplica";
  if (value === "pendente") return "Pendente";
  if (value === "assinado") return "Assinado";
  return "Recusada";
}
