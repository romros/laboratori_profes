import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, Plus, Minus, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export function NewCorrectionScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [examFile, setExamFile] = useState<string | null>(null);
  const [solutionFile, setSolutionFile] = useState<string | null>(null);
  const [studentFile, setStudentFile] = useState<string | null>(null);

  const [rubric, setRubric] = useState([
    {
      name: "Exercici 1",
      points: 3,
      criteria: [
        { name: "Estructura correcta", points: 1.5 },
        { name: "Claus primàries", points: 1.0 },
        { name: "Nomenclatura", points: 0.5 },
      ],
    },
    {
      name: "Exercici 2",
      points: 4,
      criteria: [
        { name: "Correcció del model", points: 2.0 },
        { name: "Cardinalitat", points: 1.0 },
        { name: "Normalització", points: 1.0 },
      ],
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "exam") setExamFile(file.name);
      else if (type === "solution") setSolutionFile(file.name);
      else if (type === "student") setStudentFile(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Nova correcció
        </h1>

        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num
                    ? "bg-[#2563EB] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 ${
                    step > num ? "bg-[#2563EB]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pujar examen (PDF)
              </label>
              <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {examFile || "Clica per pujar l'examen"}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "exam")}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pujar solució (PDF o text)
              </label>
              <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {solutionFile || "Clica per pujar la solució"}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={(e) => handleFileChange(e, "solution")}
                />
              </label>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!examFile || !solutionFile}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar rúbrica
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              {rubric.map((exercise, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      {exercise.name} ({exercise.points} punts)
                    </h3>
                  </div>
                  <div className="space-y-2 ml-4">
                    {exercise.criteria.map((criterion, cidx) => (
                      <div
                        key={cidx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">{criterion.name}</span>
                        <span className="text-gray-600">
                          {criterion.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 mb-3">Regles de correcció</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="partial" defaultChecked />
                  <Label htmlFor="partial" className="text-sm text-gray-700">
                    Donar puntuació parcial
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="penalize" defaultChecked />
                  <Label htmlFor="penalize" className="text-sm text-gray-700">
                    Penalitzar errors conceptuals
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="short" defaultChecked />
                  <Label htmlFor="short" className="text-sm text-gray-700">
                    Mantenir feedback breu
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="px-6 py-3 rounded-lg"
              >
                Enrere
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-lg"
              >
                Confirmar rúbrica
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pujar exàmens dels estudiants (PDF)
              </label>
              <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {studentFile || "Clica per pujar els exàmens"}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "student")}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Escaneja amb el mòbil (Lens, Adobe Scan...)
              </p>
            </div>

            {studentFile && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="text-sm text-gray-700">
                  ✓ 50 estudiants detectats
                </div>
                <div className="text-sm text-gray-700">✓ 3 pàgines per estudiant</div>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>2 pàgines de baixa qualitat</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="px-6 py-3 rounded-lg"
              >
                Enrere
              </Button>
              <Button
                onClick={() => navigate("/processing")}
                disabled={!studentFile}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Corregir exàmens
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
