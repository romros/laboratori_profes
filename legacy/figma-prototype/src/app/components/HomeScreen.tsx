import { useNavigate } from "react-router";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

export function HomeScreen() {
  const navigate = useNavigate();

  const recentSessions = [
    { id: 1, name: "UF2 SQL — 50 exàmens", status: "completed" },
    { id: 2, name: "Java — Parcial 1", status: "review" },
    { id: 3, name: "UML — Recuperació", status: "completed" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">
            Correcció d'exàmens
          </h1>
          <Button
            onClick={() => navigate("/new-correction")}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-6 py-6 rounded-xl text-base"
          >
            + Nova correcció
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Sessions recents
          </h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/results/${session.id}`)}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{session.name}</span>
                </div>
                {session.status === "completed" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Completat</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Cal revisar</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Crèdits disponibles: <span className="font-medium text-gray-700">12</span>
          </div>
          <Button
            onClick={() => navigate("/credits")}
            variant="outline"
            className="text-[#2563EB] border-[#2563EB] hover:bg-[#2563EB]/5"
          >
            Comprar més crèdits
          </Button>
        </div>
      </div>
    </div>
  );
}
