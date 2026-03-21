import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  Users,
  BarChart3,
  FileSpreadsheet,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const steps = [
  {
    n: 1,
    title: "Puja l’examen i la solució",
    desc: "PDF de l’enunciat i del model de resposta.",
  },
  {
    n: 2,
    title: "Generació automàtica de rúbrica",
    desc: "A partir del teu material, sense escriure criteris a mà.",
  },
  {
    n: 3,
    title: "Validació ràpida",
    desc: "Revisa i ajusta la rúbrica en uns minuts.",
  },
  {
    n: 4,
    title: "Puja els exàmens dels estudiants",
    desc: "Escanejats o PDF; el sistema els alinea sol.",
  },
  {
    n: 5,
    title: "Resultats en minuts",
    desc: "Notes, feedback i exportació quan vulguis.",
  },
];

const featureBullets = [
  "Puntuació per pregunta o apartat",
  "Nota final calculada",
  "Feedback per a l’estudiant (didàctic)",
  "Resum per al professor (patrons d’error)",
  "Exportació a Excel",
];

const faqItems = [
  {
    q: "Funciona amb exàmens escrits a mà?",
    a: "Sí, sempre que el PDF sigui llegible. Molts professors escanejen amb el mòbil (Lens, Adobe Scan, etc.) i pugen el fitxer.",
  },
  {
    q: "Puc editar les notes abans de donar-les?",
    a: "Sí. Veus el desglossament, pots ajustar puntuacions i el text de feedback com en un full de càlcul.",
  },
  {
    q: "Com es paga?",
    a: "Model per ús: pagues per correccions o paquets de crèdits. Hi ha període de prova per provar el flux sense compromís.",
  },
  {
    q: "Cal canviar com faig els exàmens?",
    a: "No. Continues plantejant l’examen com sempre; l’eina s’adapta al PDF que pengis.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const accesRef = useRef<HTMLDivElement>(null);

  const scrollToAcces = () => {
    accesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-gray-900 sm:text-base">
            Correcció express
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="hidden text-gray-600 sm:inline-flex"
              onClick={scrollToAcces}
            >
              Accés professor
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-[#2563EB] px-3 text-sm hover:bg-[#1d4ed8] sm:px-4"
              onClick={scrollToAcces}
            >
              Provar gratis
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO + login */}
        <section className="border-b border-gray-100">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:gap-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Corregeix 50 exàmens en minuts
              </h1>
              <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">
                Puja l’examen i la solució, valida la rúbrica en 2 minuts i obtén
                notes i feedback automàtic.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 rounded-lg bg-[#2563EB] px-8 text-base hover:bg-[#1d4ed8]"
                  onClick={scrollToAcces}
                >
                  Provar gratis
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Sense configurar res. Sense canviar la teva manera de treballar.
              </p>
            </div>

            <div ref={accesRef} id="acces" className="scroll-mt-24">
              <Card className="border border-gray-200 bg-white shadow-md">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Accés de professor
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Inicia sessió per començar una correcció.
                    </p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Correu electrònic
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="professor@escola.cat"
                        className="mt-1.5 h-11 rounded-lg border-gray-200"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Contrasenya
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5 h-11 rounded-lg border-gray-200"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8]"
                    >
                      Iniciar sessió
                    </Button>
                  </form>
                  <p className="border-t border-gray-100 pt-4 text-center text-sm text-gray-600">
                    <a
                      href="#"
                      className="font-medium text-[#2563EB] hover:underline"
                    >
                      Has oblidat la contrasenya?
                    </a>
                    <span className="mx-2 text-gray-300">·</span>
                    <a
                      href="#"
                      className="font-medium text-[#2563EB] hover:underline"
                    >
                      Registre gratuït
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="border-b border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Corregir exàmens no hauria de portar hores
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              Corregir a mà 30 o 50 llums és repetitiu: mateixes rúbriques, mateixes
              frases de feedback, mateixes distraccions. A més, costa mantenir
              criteris homogenis entre correccions i entre professors.
            </p>
          </div>
        </section>

        {/* SOLUTION — 5 steps */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Com funciona
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
              Cinc passos concrets, del PDF inicial a les notes llestes.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
              {steps.map((s) => (
                <Card
                  key={s.n}
                  className="border border-gray-200 bg-white shadow-sm"
                >
                  <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#2563EB]/10 text-sm font-bold text-[#2563EB]">
                      {s.n}
                    </span>
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-sm leading-snug text-gray-600">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* OUTPUT + mockup */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Què obtens
                </h2>
                <ul className="mt-6 space-y-3">
                  {featureBullets.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-gray-700"
                    >
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#2563EB]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Vista prèvia (exemple)
                </p>
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
                    <span className="text-xs font-medium text-gray-700">
                      UF2 SQL — 50 exàmens
                    </span>
                    <span className="text-xs text-[#2563EB]">Exportar Excel</span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-gray-500 sm:text-xs">
                      <span>Estudiant</span>
                      <span className="text-center">Ex1</span>
                      <span className="text-center">Ex2</span>
                      <span className="text-center">Nota</span>
                    </div>
                    {[
                      ["Anna P.", "2.5", "3.2", "6.5"],
                      ["Marc R.", "1.5", "1.0", "3.5"],
                      ["Laura G.", "2.8", "2.4", "7.2"],
                    ].map(([n, a, b, g]) => (
                      <div
                        key={n}
                        className="mt-2 grid grid-cols-4 gap-2 rounded-md border border-gray-100 bg-white px-2 py-2 text-[10px] sm:text-xs"
                      >
                        <span className="font-medium text-gray-900">{n}</span>
                        <span className="text-center text-gray-700">{a}</span>
                        <span className="text-center text-gray-700">{b}</span>
                        <span className="text-center font-semibold text-[#2563EB]">
                          {g}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFERENTIATION */}
        <section className="border-b border-gray-100 bg-[#2563EB]/5">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <Card className="border border-[#2563EB]/20 bg-white shadow-md">
              <CardContent className="p-6 sm:p-10">
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  No és una eina per ajudar-te a corregir
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  És una eina que et dona la correcció feta: notes, errors
                  detectats i textos de feedback que pots revisar i enviar. Tu
                  només validas i ajustes quan cal.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SCANNING */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-10 sm:p-10">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB]/10 sm:size-20">
                <ScanLine className="size-8 text-[#2563EB] sm:size-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Escaneja amb el mòbil, puja el PDF
                </h2>
                <p className="mt-3 text-gray-600">
                  Amb{" "}
                  <strong className="font-medium text-gray-800">
                    Google Lens, Microsoft Lens, Adobe Scan
                  </strong>{" "}
                  o l’app del teu centre: fots, retalla i generes un PDF net. No
                  cal escàner de despatx ni programari rar: si el text es llegeix
                  bé, el flux funciona.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="border-b border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6 sm:py-20">
            <BarChart3 className="mx-auto size-10 text-[#2563EB]" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Pagament per ús
            </h2>
            <p className="mt-4 text-gray-600">
              Pagues per correccions o per paquets de crèdits; sense subscripció
              forçada si no la vols. Inclou{" "}
              <strong className="font-medium text-gray-800">
                prova gratuïta
              </strong>{" "}
              per fer una sessió completa i veure si encaixa amb la teva assignatura.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Preguntes freqüents
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`item-${i}`}
                  className="border-gray-200"
                >
                  <AccordionTrigger className="text-left text-base font-medium text-gray-900 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-[#2563EB] px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Estalvia hores de correcció cada setmana
            </h2>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="mt-8 h-12 rounded-lg bg-white px-10 text-base font-semibold text-[#2563EB] shadow-md hover:bg-gray-50"
              onClick={scrollToAcces}
            >
              Provar gratis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-4">
          <span>© {new Date().getFullYear()} Correcció express</span>
          <span className="hidden text-gray-300 sm:inline">|</span>
          <span className="flex items-center gap-1">
            <Upload className="size-3.5" /> PDF
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5" /> Rúbrica
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> Estudiants
          </span>
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="size-3.5" /> Excel
          </span>
        </div>
      </footer>
    </div>
  );
}
