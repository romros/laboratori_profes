import { useState } from "react";
import { useNavigate } from "react-router";
import { Download, AlertTriangle, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export function ResultsScreen() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState([
    { id: 1, name: "Anna P.", ex1: 2.5, ex2: 3.2, ex3: 2.8, grade: 6.5, needsReview: false, comments: "" },
    { id: 2, name: "Marc R.", ex1: 1.5, ex2: 1.0, ex3: 1.0, grade: 3.5, needsReview: true, comments: "Revisar normalització" },
    { id: 3, name: "Laura G.", ex1: 2.8, ex2: 2.4, ex3: 2.0, grade: 7.2, needsReview: false, comments: "" },
    { id: 4, name: "Pau M.", ex1: 2.0, ex2: 1.8, ex3: 2.0, grade: 5.8, needsReview: false, comments: "" },
    { id: 5, name: "Maria S.", ex1: 1.2, ex2: 1.5, ex3: 1.5, grade: 4.2, needsReview: true, comments: "Errors conceptuals" },
    { id: 6, name: "Joan T.", ex1: 2.8, ex2: 3.0, ex3: 2.3, grade: 8.1, needsReview: false, comments: "" },
    { id: 7, name: "Sofia L.", ex1: 2.3, ex2: 2.4, ex3: 2.2, grade: 6.9, needsReview: false, comments: "" },
    { id: 8, name: "David R.", ex1: 1.8, ex2: 1.7, ex3: 2.0, grade: 5.5, needsReview: false, comments: "" },
  ]);

  const updateStudentField = (id: number, field: string, value: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        const updated = { ...student, [field]: value };
        if (field === 'ex1' || field === 'ex2' || field === 'ex3') {
          const ex1 = field === 'ex1' ? parseFloat(value) || 0 : student.ex1;
          const ex2 = field === 'ex2' ? parseFloat(value) || 0 : student.ex2;
          const ex3 = field === 'ex3' ? parseFloat(value) || 0 : student.ex3;
          updated.grade = ex1 + ex2 + ex3;
        }
        return updated;
      }
      return student;
    }));
  };

  const studentDetail = {
    name: selectedStudent?.name || "",
    grade: selectedStudent?.grade || 0,
    breakdown: [
      { exercise: "Exercici 1", earned: 2.5, total: 3 },
      { exercise: "Exercici 2", earned: 3.2, total: 4 },
      { exercise: "Exercici 3", earned: 1.8, total: 3 },
    ],
    errors: [
      "Falta declaració de clau forana a la taula 'comandes'",
      "Normalització incorrecta en 3NF",
      "Error de sintaxi a la sentència CREATE TABLE",
    ],
    studentFeedback:
      "Bona comprensió dels conceptes bàsics de bases de dades. Cal treballar les regles de normalització i les relacions amb claus foranes. Revisa la diferència entre 2NF i 3NF.",
    teacherInsight:
      "Patró comú: confon els nivells de normalització. Suggereixo revisar exemples de la UF2.",
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <Button
            onClick={() => navigate("/home")}
            variant="outline"
            className="mb-4"
          >
            ← Tornar a l'inici
          </Button>
          <h1 className="mb-4 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Resultats
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:text-base">
            <div className="text-gray-700">
              <span className="font-medium">50</span> exàmens corregits
            </div>
            <div className="text-orange-600">
              <span className="font-medium">6</span> per revisar
            </div>
            <div className="text-gray-700">
              Nota mitjana: <span className="font-medium">5.8</span>
            </div>
          </div>

          <Button className="rounded-lg bg-[#2563EB] px-6 py-3 text-white hover:bg-[#1d4ed8]">
            <Download className="mr-2 size-4" />
            Exportar Excel
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                    Estudiant
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Ex1 (3p)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Ex2 (4p)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Ex3 (3p)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Nota
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Comentaris
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Acció
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      student.needsReview ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {student.name}
                        </span>
                        {student.needsReview && (
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={student.ex1}
                        onChange={(e) => updateStudentField(student.id, 'ex1', e.target.value)}
                        className="w-20 text-center h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4"
                        value={student.ex2}
                        onChange={(e) => updateStudentField(student.id, 'ex2', e.target.value)}
                        className="w-20 text-center h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        value={student.ex3}
                        onChange={(e) => updateStudentField(student.id, 'ex3', e.target.value)}
                        className="w-20 text-center h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`text-center font-semibold text-sm ${
                          student.grade >= 5 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {student.grade.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={student.comments}
                        onChange={(e) => updateStudentField(student.id, 'comments', e.target.value)}
                        placeholder="Afegir comentari..."
                        className="w-full h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => setSelectedStudent(student)}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Sheet open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <SheetContent className="flex h-full max-h-dvh w-full max-w-full flex-col gap-0 overflow-hidden border-l border-gray-200 bg-white p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <SheetHeader className="shrink-0 space-y-4 border-b border-gray-200 p-4 sm:p-6">
            <SheetTitle className="flex flex-col gap-4 text-xl text-gray-900 sm:flex-row sm:items-center sm:justify-between sm:text-2xl">
              <span className="break-words pr-8">{studentDetail.name}</span>
              <Button
                onClick={() => alert("Descarregant PDF...")}
                variant="outline"
                size="sm"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
              >
                <Download className="size-4" />
                Descarregar PDF
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Vista prèvia de l'examen
                </span>
                <span className="text-xs text-gray-500">Pàgina 1 de 3</span>
              </div>
              <div className="flex min-h-[200px] items-center justify-center bg-white py-8 text-gray-400 sm:min-h-[22rem] sm:py-0">
                <div className="space-y-3 px-4 text-center">
                  <FileText className="mx-auto size-12 text-gray-300 sm:size-16" />
                  <p className="text-sm">Vista prèvia del PDF de l'examen</p>
                  <p className="break-all text-xs">
                    examen_{studentDetail.name.replace(/\s/g, "_")}.pdf
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exercici 1 (màx. 3)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="3"
                  defaultValue={selectedStudent?.ex1 || 0}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exercici 2 (màx. 4)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  defaultValue={selectedStudent?.ex2 || 0}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exercici 3 (màx. 3)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="3"
                  defaultValue={selectedStudent?.ex3 || 0}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nota final
                </label>
                <div className="text-3xl font-bold text-gray-900">
                  {studentDetail.grade.toFixed(1)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-medium text-gray-900">Errors detectats</h3>
              <ul className="space-y-2">
                {studentDetail.errors.map((error, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-sm text-gray-700"
                  >
                    <span className="shrink-0 text-red-500">•</span>
                    <span className="min-w-0">{error}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-900">
                Feedback per a l'estudiant
              </label>
              <Textarea
                defaultValue={studentDetail.studentFeedback}
                rows={4}
                className="w-full min-h-[6rem] text-sm"
                placeholder="Escriu el feedback per a l'estudiant..."
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-900">
                Notes privades del professor
              </label>
              <Textarea
                defaultValue={studentDetail.teacherInsight}
                rows={3}
                className="min-h-[5rem] w-full bg-gray-50 text-sm"
                placeholder="Notes privades només per a tu..."
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row">
              <Button
                onClick={() => {
                  alert("Canvis guardats correctament");
                  setSelectedStudent(null);
                }}
                className="flex-1 rounded-lg bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              >
                Guardar canvis
              </Button>
              <Button
                onClick={() => setSelectedStudent(null)}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                Cancel·lar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
