import type { IncomingMessage } from 'node:http'

import type { Feature0AnalysisResponse } from '../contracts/feature0AnalysisContract'

import { Feature0LlmNotConfiguredError } from './feature0AnalysisLlmHandler'
import {
  Feature0PdfInputError,
  handleFeature0AnalysisPdfLlm,
  handleFeature0AnalysisPdfStub,
} from './feature0AnalysisPdfHandler'
import { Feature0PdfMultipartError, parseFeature0PdfMultipart } from './parseFeature0PdfMultipart'

export type Feature0PdfHttpSuccess = {
  ok: true
  status: 200
  body: Feature0AnalysisResponse
}

export type Feature0PdfHttpError = {
  ok: false
  status: 400 | 413 | 500 | 503
  body: { error: string }
}

export async function executeFeature0AnalysisPdfStubFromRequest(
  req: IncomingMessage,
): Promise<Feature0PdfHttpSuccess | Feature0PdfHttpError> {
  try {
    const { buffer, filename } = await parseFeature0PdfMultipart(req)
    const body = await handleFeature0AnalysisPdfStub(buffer, filename)
    return { ok: true, status: 200, body }
  } catch (e) {
    return mapPdfRouteError(e)
  }
}

export async function executeFeature0AnalysisPdfLlmFromRequest(
  req: IncomingMessage,
): Promise<Feature0PdfHttpSuccess | Feature0PdfHttpError> {
  try {
    const { buffer } = await parseFeature0PdfMultipart(req)
    const body = await handleFeature0AnalysisPdfLlm(buffer)
    return { ok: true, status: 200, body }
  } catch (e) {
    if (e instanceof Feature0LlmNotConfiguredError) {
      return { ok: false, status: 503, body: { error: e.message } }
    }
    return mapPdfRouteError(e)
  }
}

function mapPdfRouteError(e: unknown): Feature0PdfHttpError {
  if (e instanceof Feature0PdfMultipartError) {
    return { ok: false, status: e.statusCode as 400 | 413, body: { error: e.message } }
  }
  if (e instanceof Feature0PdfInputError) {
    return { ok: false, status: 400, body: { error: e.message } }
  }
  const msg = e instanceof Error ? e.message : String(e)
  return { ok: false, status: 500, body: { error: msg } }
}
