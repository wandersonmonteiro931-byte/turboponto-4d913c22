import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Cargo = {
  id: string;
  codigo: string;
  nome: string;
};

export function CargoSelect({
  empresaId,
  value,
  onChange,
  disabled = false,
}: {
  empresaId: string | null;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const carregar = async () => {
    if (!empresaId) {
      setCargos([]);
      return;
    }

    const { data, error } = await supabase
      .from("cargos")
      .select("id,codigo,nome")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("codigo");

    if (error) {
      toast.error(error.message);
      return;
    }

    setCargos((data ?? []) as Cargo[]);
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const proximoCodigo = async () => {
    if (!empresaId) return "0001";

    const { data } = await supabase
      .from("cargos")
      .select("codigo")
      .eq("empresa_id", empresaId)
      .order("codigo", { ascending: false })
      .limit(1)
      .maybeSingle();

    const atual = Number.parseInt(data?.codigo ?? "0", 10);
    return String(Number.isFinite(atual) ? atual + 1 : 1).padStart(4, "0");
  };

  const cadastrar = async () => {
    if (!empresaId) return;
    const nome = novoNome.trim().toUpperCase();

    if (!nome) return toast.error("Informe o nome do cargo");
    if (nome.length > 10) return toast.error("O cargo deve ter no máximo 10 caracteres");

    setSalvando(true);
    const codigo = await proximoCodigo();
    const { error } = await supabase.from("cargos").insert({
      empresa_id: empresaId,
      codigo,
      nome,
      ativo: true,
    });
    setSalvando(false);

    if (error) return toast.error(error.message);

    await carregar();
    onChange(nome);
    setNovoNome("");
    setNovoOpen(false);
    toast.success("Cargo cadastrado");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !empresaId}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{value || "Selecione o cargo"}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cargo..." />
            <CommandList>
              <CommandEmpty>Nenhum cargo encontrado.</CommandEmpty>
              <CommandGroup>
                {value && !cargos.some((cargo) => cargo.nome === value) && (
                  <CommandItem value={value} onSelect={() => setOpen(false)}>
                    <Check className="h-4 w-4 opacity-100" />
                    {value}
                  </CommandItem>
                )}
                {cargos.map((cargo) => (
                  <CommandItem
                    key={cargo.id}
                    value={`${cargo.nome} ${cargo.codigo}`}
                    onSelect={() => {
                      onChange(cargo.nome);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", value === cargo.nome ? "opacity-100" : "opacity-0")} />
                    <span>{cargo.nome}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{cargo.codigo}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {!disabled && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="cadastrar novo cargo"
                      onSelect={() => {
                        setOpen(false);
                        setNovoOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar novo cargo
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo cargo</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="mb-1 block text-xs">Nome do cargo</Label>
            <Input
              autoFocus
              maxLength={10}
              value={novoNome}
              onChange={(event) => setNovoNome(event.target.value.toUpperCase())}
              placeholder="MAX 10 CAR"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void cadastrar();
                }
              }}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{novoNome.length}/10</div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void cadastrar()} disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
