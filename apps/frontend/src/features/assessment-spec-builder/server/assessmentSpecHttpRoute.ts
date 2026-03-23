import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec } from '../services/buildAssessmentSpec'
import { buildAssessmentSpecWithPedagogicEnrichment } from '../services/buildAssessmentSpecWithPedagogicEnrichment'

export type AssessmentSpecHttpOutcome =
  | { ok: true; status: 200; body: { result: AssessmentSpec } }
  | {
      ok: false
      status: 400 | 502 | 503 | 500
      body: { error: { code: string; message: string } }
    }

export async function executeAssessmentSpecBuildFromJsonBody(
  jsonString: string,
): Promise<AssessmentSpecHttpOutcome> {
  let parsed: unknown
  try {
    parsed = jsonString.trim() === '' ? {} : JSON.parse(jsonString)
  } catch {
    return {
      ok: false,
      status: 400,
      body: { error: { code: 'invalid_json', message: 'JSON invàlid al cos de la petició' } },
    }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('exam_text' in parsed) ||
    !('solution_text' in parsed)
  ) {
    return {
      ok: false,
      status: 400,
      body: {
        error: {
          code: 'missing_fields',
          message: 'Cal proporcionar exam_text i solution_text',
        },
      },
    }
  }

  const body = parsed as Record<string, unknown>

  const pedagogicEnrichment =
    body.pedagogic_enrichment === true ||
    body.pedagogic_enrichment === 'true' ||
    body.pedagogic_enrichment === 1

  if (typeof body.exam_text !== 'string' || typeof body.solution_text !== 'string') {
    return {
      ok: false,
      status: 400,
      body: {
        error: {
          code: 'invalid_fields',
          message: 'exam_text i solution_text han de ser strings',
        },
      },
    }
  }

  const apiKey =
    process.env.ASSESSMENT_SPEC_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.FEATURE0_OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      body: {
        error: {
          code: 'not_configured',
          message:
            'Assessment Spec Builder: cal ASSESSMENT_SPEC_OPENAI_API_KEY, OPENAI_API_KEY o FEATURE0_OPENAI_API_KEY (servidor).',
        },
      },
    }
  }

  try {
    const buildParams = {
      examText: body.exam_text,
      solutionText: body.solution_text,
      apiKey,
    }
    const result = pedagogicEnrichment
      ? await buildAssessmentSpecWithPedagogicEnrichment(buildParams)
      : await buildAssessmentSpec(buildParams)
    return { ok: true, status: 200, body: { result } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.startsWith('Enriqueiment pedagògic:')) {
      return {
        ok: false,
        status: 400,
        body: { error: { code: 'model_parse_error', message: msg } },
      }
    }
    if (msg.startsWith('Resposta del model:')) {
      return {
        ok: false,
        status: 400,
        body: { error: { code: 'model_parse_error', message: msg } },
      }
    }
    if (msg.startsWith('API model:')) {
      return { ok: false, status: 502, body: { error: { code: 'api_error', message: msg } } }
    }
    return { ok: false, status: 500, body: { error: { code: 'internal_error', message: msg } } }
  }
}
