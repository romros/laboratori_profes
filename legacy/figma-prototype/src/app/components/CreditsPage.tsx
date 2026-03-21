import { useNavigate } from "react-router";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "./ui/button";

export function CreditsPage() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Pack Bàsic",
      credits: 50,
      price: 19,
      description: "Ideal per començar",
      features: [
        "50 crèdits",
        "Fins a 500 exàmens",
        "Rúbriques personalitzades",
        "Feedback automàtic",
        "Exportació a Excel",
      ],
      popular: false,
    },
    {
      name: "Pack Estàndard",
      credits: 150,
      price: 49,
      description: "El més popular",
      features: [
        "150 crèdits",
        "Fins a 1500 exàmens",
        "Rúbriques personalitzades",
        "Feedback automàtic",
        "Exportació a Excel",
        "Suport prioritari",
      ],
      popular: true,
    },
    {
      name: "Pack Professional",
      credits: 500,
      price: 149,
      description: "Per a grans necessitats",
      features: [
        "500 crèdits",
        "Fins a 5000 exàmens",
        "Rúbriques personalitzades",
        "Feedback automàtic",
        "Exportació a Excel",
        "Suport prioritari",
        "Anàlisi estadística avançada",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Button
          onClick={() => navigate("/home")}
          variant="outline"
          className="mb-8"
        >
          ← Tornar a l'inici
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Compra crèdits
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cada crèdit et permet corregir aproximadament 10 exàmens. Escull el pack que millor s'adapti a les teves necessitats.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-8 ${
                plan.popular
                  ? "border-2 border-[#2563EB] shadow-xl"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Més popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}€
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-medium">{plan.credits} crèdits</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  alert(`Redirigint al pagament de ${plan.name}...`);
                }}
                className={`w-full h-11 rounded-lg mb-6 ${
                  plan.popular
                    ? "bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
              >
                Comprar ara
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Preguntes freqüents
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Què és un crèdit?
                </h3>
                <p className="text-sm text-gray-600">
                  Un crèdit et permet processar aproximadament 10 exàmens. El nombre exacte pot variar segons la complexitat de l'examen i la longitud de les respostes.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Els crèdits caduquen?
                </h3>
                <p className="text-sm text-gray-600">
                  No, els crèdits que compres no caduquen mai. Els pots utilitzar quan vulguis.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Quins mètodes de pagament accepteu?
                </h3>
                <p className="text-sm text-gray-600">
                  Acceptem targetes de crèdit/dèbit (Visa, Mastercard, American Express) i transferència bancària per a compres superiors a 100€.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Puc sol·licitar factura?
                </h3>
                <p className="text-sm text-gray-600">
                  Sí, després de completar la compra rebràs automàticament una factura al teu correu electrònic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
