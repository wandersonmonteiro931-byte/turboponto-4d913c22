import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import {
  carregarCargos,
  criarCargoLocal,
  ouvirAtualizacaoCargos,
  type CargoCadastro,
} from "@/lib/cargos";
import { toast } from "sonner";

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
  const [cargos, setCargos] = useState<CargoCadastro[]>([]);

  const carregar = () => {
    setCargos(carregarCargos(empresaId).filter((cargo) => cargo.ativo));
  };

  useEffect(() => {
    carregar();
    if (!empresaId) return;
    return ouvirAtualizacaoCargos(empresaId, carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const cadastrar = () => {
    if (!empresaId) return;
    const nome = novoNome.trim().toUpperCase();

    if (!nome) return toast.error("Informe o nome do cargo");
    if (nome.length > 10) return toast.error("O cargo deve ter no máximo 10 caracteres");

    setSalvando(true);
    try {
      const cargo = criarCargoLocal(empresaId, nome);
      carregar();
      onChange(cargo.nome);
      setNovoNome("");
      setNovoOpen(false);
      toast.success("Cargo cadastrado");
    } catch {
      toast.error("Não foi possível salvar o cargo neste navegador");
    } finally {
      setSalvando(false);
    }
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
                  cadastrar();
                }
              }}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{novoNome.length}/10</div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={cadastrar} disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
