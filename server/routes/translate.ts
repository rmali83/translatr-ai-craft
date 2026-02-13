import { Router, Request, Response } from 'express';
import { translateText, detectLanguage } from '../services/aiService';

const router = Router();

// POST /api/translate
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    // Validation
    if (!text || !targetLang) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text and target language are required',
      });
    }

    // Translate text
    const translation = await translateText(text, sourceLang, targetLang);

    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        translatedText: translation,
        sourceLang: sourceLang || 'auto',
        targetLang,
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to translate text',
    });
  }
});

// POST /api/translate/detect
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required',
      });
    }

    const detectedLang = await detectLanguage(text);

    res.status(200).json({
      success: true,
      data: {
        text,
        detectedLanguage: detectedLang,
      },
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to detect language',
    });
  }
});

export default router;
