import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";

interface Props {
  servicoSelecionado: string;
  onServicoChange: (codigo: string) => void;
}

const StepTipoUsuario = ({ servicoSelecionado, onServicoChange }: Props) => {
  const { servicos, loading, error } = useServicos();

  return (
    <div className="space-y-8">
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