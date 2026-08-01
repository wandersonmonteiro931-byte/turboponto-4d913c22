import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  carregarCargos,
  criarCargoLocal,
  ouvirAtualizacaoCargos,
  salvarCargos,
  type CargoCadastro,
} from "@/lib/cargos";

export const Route = createFileRoute("/app/empresa/cargos")({
  component: CargosPage,
});

function CargosPage() {
  const { empresaId, role } = useAuth();
  const podeEditar = role === "admin";
  const [lista, setLista] = useState<CargoCadastro[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<CargoCadastro | null>(null);

  const carregar = () => setLista(carregarCargos(empresaId));

  useEffect(() => {
    carregar();
    if (!empresaId) return;
    return ouvirAtualizacaoCargos(empresaId, carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const filtrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;
    return lista.filter((cargo) => cargo.nome.toLowerCase().includes(termo) || cargo.codigo.includes(termo));
  }, [busca, lista]);

  const remover = async (cargo: CargoCadastro) => {
    if (!empresaId) return;
    if (!confirm(`Remover o cargo ${cargo.nome}?`)) return;

    const { count, error } = await supabase
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("cargo", cargo.nome);

    if (error) return toast.error(error.message);
    if ((count ?? 0) > 0) {
      return toast.error("Este cargo está vinculado a funcionário. Inative-o em vez de remover.");
    }

    try {
      salvarCargos(
        empresaId,
        lista.filter((item) => item.id !== cargo.id),
      );
      toast.success("Cargo removido");
    } catch {
      toast.error("Não foi possível remover o cargo");
    }
  };

  if (!empresaId) {
    return <p className="text-sm text-muted-foreground">Cadastre primeiro os dados da empresa.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Cargos</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os cargos da empresa. Eles aparecerão como opções ao cadastrar ou editar o funcionário.
          </p>
        </div>
        {podeEditar && (
          <Button
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Novo cargo
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por código ou cargo"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtrada.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cargo encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-2 w-32">Código</th>
                    <th className="text-left p-2">Cargo</th>
                    <th className="text-left p-2 w-20">Status</th>
                    {podeEditar && <th className="text-right p-2 w-24">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrada.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-muted/30">
                      <td className="p-2 font-mono">{cargo.codigo}</td>
                      <td className="p-2">{cargo.nome}</td>
                      <td className="p-2 text-xs">{cargo.ativo ? "Ativo" : "Inativo"}</td>
                      {podeEditar && (
                        <td className="p-2 text-right whitespace-nowrap space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEdit(cargo);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void remover(cargo)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <EditorCargo
          empresaId={empresaId}
          cargo={edit}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function EditorCargo({
  empresaId,
  cargo,
  onClose,
  onSaved,
}: {
  empresaId: string;
  cargo: CargoCadastro | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(cargo?.nome ?? "");
  const [ativo, setAtivo] = useState(cargo?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const nomeFinal = nome.trim().toUpperCase();
    if (!nomeFinal) return toast.error("Informe o nome do cargo");
    if (nomeFinal.length > 10) return toast.error("O cargo deve ter no máximo 10 caracteres");

    setSalvando(true);
    try {
      const listaAtual = carregarCargos(empresaId);
      const duplicado = listaAtual.some((item) => item.id !== cargo?.id && item.nome === nomeFinal);
      if (duplicado) {
        toast.error("Este cargo já está cadastrado");
        return;
      }

      if (cargo) {
        salvarCargos(
          empresaId,
          listaAtual.map((item) => (item.id === cargo.id ? { ...item, nome: nomeFinal, ativo } : item)),
        );

        if (cargo.nome !== nomeFinal) {
          const { error } = await supabase
            .from("funcionarios")
            .update({ cargo: nomeFinal })
            .eq("empresa_id", empresaId)
            .eq("cargo", cargo.nome);
          if (error) throw error;
        }
      } else {
        const novo = criarCargoLocal(empresaId, nomeFinal);
        if (!ativo) {
          const atualizados = carregarCargos(empresaId).map((item) =>
            item.id === novo.id ? { ...item, ativo: false } : item,
          );
          salvarCargos(empresaId, atualizados);
        }
      }

      toast.success("Cargo salvo");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cargo");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cargo ? "Editar cargo" : "Novo cargo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {cargo && (
            <div>
              <Label className="text-xs">Código</Label>
              <Input value={cargo.codigo} disabled />
            </div>
          )}
          <div>
            <Label className="text-xs">Cargo</Label>
            <Input
              maxLength={10}
              value={nome}
              onChange={(event) => setNome(event.target.value.toUpperCase())}
              placeholder="MAX 10 CAR"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{nome.length}/10</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} />
            Ativo
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
