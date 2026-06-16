import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Briefcase, MapPin } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";

interface Props {
  value: string;
  onChange: (v: "cliente" | "assessor") => void;
  servicoSelecionado: string;
  onServicoChange: (codigo: string) => void;
}

const StepTipoUsuario = ({ value, onChange, servicoSelecionado, onServicoChange }: Props) => {
  const { servicos, loading, error } = useServicos();

  return (
    <div className="space-y-8">
      {/* Seção: Tipo de Usuário */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">Tipo de Usuário</h2>
        <p className="text-sm text-muted-foreground mt-1">Selecione como deseja prosseguir</p>
        
        <div className="mt-4">
          <RadioGroup value={value} onValueChange={(v) => onChange(v as "cliente" | "assessor")} className="grid gap-4">
            {[
              { val: "cliente", label: "Cliente", desc: "Estou solicitando para mim ou minha família", icon: User },
              { val: "assessor", label: "Assessor", desc: "Estou solicitando em nome de um cliente", icon: Briefcase },
            ].map(({ val, label, desc, icon: Icon }) => (
              <Label
                key={val}
                htmlFor={val}
                className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                  value === val ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <RadioGroupItem value={val} id={val} />
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{label}</span>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Seção: Seleção de Serviço */}
        <div className="animate-slide-in">
          <h2 className="text-xl font-serif font-semibold text-foreground">Selecione o Serviço</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha o tipo de serviço desejado</p>
          
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Carregando serviços...
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">
                Erro ao carregar serviços. Por favor, tente novamente.
              </div>
            ) : servicos.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhum serviço disponível no momento.
              </div>
            ) : (
              <div className="space-y-2">
                <Select 
                  value={servicoSelecionado} 
                  onValueChange={onServicoChange}
                >
                  <SelectTrigger className="h-11">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                    <SelectValue placeholder="Selecione o serviço desejado" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.code}>
                        {servico.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      
    </div>
  );
};

export default StepTipoUsuario;