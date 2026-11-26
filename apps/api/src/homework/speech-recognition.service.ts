import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { v2 } from '@google-cloud/speech';

export const SPEECH_LANGUAGES = ['en-US', 'fr-FR', 'es-ES'] as const;
export type SpeechLanguage = typeof SPEECH_LANGUAGES[number];

/** Sends a short, in-memory WebM/Opus recording to Google Cloud Speech-to-Text. */
@Injectable()
export class SpeechRecognitionService {
  private readonly location = process.env.SPEECH_TO_TEXT_LOCATION || 'us';
  private readonly client = new v2.SpeechClient({ apiEndpoint: `${this.location}-speech.googleapis.com` });
  private readonly logger = new Logger(SpeechRecognitionService.name);

  async transcribe(audio: Buffer, language: SpeechLanguage): Promise<string | null> {
    try {
      // Resolving the project must remain lazy: local development can start
      // without Google credentials when nobody is using Speak the Answer.
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || await this.client.getProjectId();
      const [response] = await this.client.recognize({
        // `_` selects V2's implicit recognizer, so no separate GCP resource
        // needs provisioning for this homework mode.
        recognizer: `projects/${projectId}/locations/${this.location}/recognizers/_`,
        content: audio,
        config: {
          // The browser submits a WebM/Opus container, which V2 detects from
          // its header. Chirp 3 is Google's current multilingual recognizer.
          autoDecodingConfig: {},
          languageCodes: [language],
          model: 'chirp_3',
          // Recognition deliberately receives no answer-specific hints: weak
          // audio such as a tap must not be pulled toward the expected answer.
        },
      });
      const alternatives = response.results?.flatMap((result) => result.alternatives?.map((alternative) => alternative.transcript?.trim() ?? '') ?? []).filter(Boolean) ?? [];
      return alternatives[0] || null;
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : 'unknown';
      this.logger.error(`Google Speech-to-Text failed (code ${code}): ${details}`);
      if (code === '7' || code === '16') throw new ServiceUnavailableException('Speech recognition is not authorized for this app. Please contact your teacher.');
      throw new ServiceUnavailableException('Speech recognition is temporarily unavailable. Please try again.');
    }
  }
}
