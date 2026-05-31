import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Briefcase } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: "cliente" | "assessor") => void;
}

const StepTipoUsuario = ({ value, onChange }: Props) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-serif font-semibold text-foreground">Tipo de Usuário</h2>
      <p className="text-sm text-muted-foreground mt-1">Selecione como deseja prosseguir</p>
    </div>
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
);

export default StepTipoUsuario;
