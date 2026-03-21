import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";

export function ProcessingScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/results/1");
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Processant exàmens...
          </h1>

          <div className="space-y-4">
            <Progress value={65} className="h-2" />

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Separant estudiants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Analitzant pàgines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
                <span>Corregint (32/50)</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">Temps estimat: 1-2 minuts</p>
        </div>
      </div>
    </div>
  );
}
