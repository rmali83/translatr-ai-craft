import axios from 'axios';

// ============================================================================
// AI Provider Interface - Makes it easy to swap providers
// ============================================================================

interface AIProvider {
  translate(prompt: string): Promise<string>;
  evaluateQuality(prompt: string): Promise<string>;
}

// ============================================================================
// Quality Evaluation Result Interface
// ============================================================================

export interface QualityEvaluation {
  score: number; // 0-100
  terminology_violations: string[];
  suggestions: string[];
  passed: boolean; // true if score >= 85
}

// ============================================================================
// OpenAI Provider Implementation
// ============================================================================

class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async translate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Return only the translated text without any explanations, notes, or additional commentary.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('OpenAI translation failed');
    }
  }

  async evaluateQuality(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a translation quality evaluator. Analyze translations and return ONLY a valid JSON object with the exact structure requested. Do not include any markdown formatting or additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('OpenAI quality evaluation error:', error.response?.data || error.message);
      throw new Error('OpenAI quality evaluation failed');
    }
  }
}

// ============================================================================
// Anthropic Provider Implementation
// ============================================================================

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async translate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are a professional translator. Return only the translated text without any explanations, notes, or additional commentary.',
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text.trim();
    } catch (error: any) {
      console.error('Anthropic API error:', error.response?.data || error.message);
      throw new Error('Anthropic translation failed');
    }
  }

  async evaluateQuality(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are a translation quality evaluator. Analyze translations and return ONLY a valid JSON object with the exact structure requested. Do not include any markdown formatting or additional text.',
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text.trim();
    } catch (error: any) {
      console.error('Anthropic quality evaluation error:', error.response?.data || error.message);
      throw new Error('Anthropic quality evaluation failed');
    }
  }
}

// ============================================================================
// Mock Provider for Testing
// ============================================================================

class MockProvider implements AIProvider {
  async translate(prompt: string): Promise<string> {
    // Extract target language from prompt
    const targetLangMatch = prompt.match(/to ([A-Za-z]+)/i);
    const targetLang = targetLangMatch ? targetLangMatch[1].toLowerCase() : 'unknown';

    // Extract source text from prompt
    const textMatch = prompt.match(/Text:\s*(.+)$/s);
    const sourceText = textMatch ? textMatch[1].trim() : 'text';

    console.log(`🔍 Mock translation - Target: "${targetLang}", Source: "${sourceText}"`);

    // Provide better mock translations for common languages
    const mockTranslations: { [key: string]: { [key: string]: string } } = {
      'urdu': {
        // Basic greetings and common phrases
        'Hello World': 'ہیلو ورلڈ',
        'This is test': 'یہ ٹیسٹ ہے',
        'Hello World, This is test': 'ہیلو ورلڈ، یہ ٹیسٹ ہے',
        'Welcome': 'خوش آمدید',
        'Thank you': 'شکریہ',
        'Good morning': 'صبح بخیر',
        'Good evening': 'شام بخیر',
        'How are you?': 'آپ کیسے ہیں؟',
        'What is your name?': 'آپ کا نام کیا ہے؟',
        'I am fine': 'میں ٹھیک ہوں',
        'Please': 'براہ کرم',
        'Sorry': 'معذرت',
        'Excuse me': 'معاف کریں',
        
        // Business and location terms
        'ENGLISH': 'انگریزی',
        'Are You Interested in a Profitable Diesel Generator Business opportunity?': 'کیا آپ منافع بخش ڈیزل جنریٹر کاروباری موقع میں دلچسپی رکھتے ہیں؟',
        'Apply Now!': 'ابھی درخواست دیں!',
        'TAFE Power Distributor Opportunities in (Country Name)': 'TAFE پاور ڈسٹری بیوٹر کے مواقع (ملک کا نام)',
        'Looking for a high-growth business opportunity?': 'کیا آپ تیزی سے بڑھنے والے کاروباری موقع کی تلاش میں ہیں؟',
        'Become a TAFE Power distributor in (Country Name) and offer your customers industry-leading power solutions and exceptional support. Leverage our brand reputation and build a thriving business.': 'TAFE پاور ڈسٹری بیوٹر بنیں (ملک کا نام) میں اور اپنے کسٹمرز کو صنعت کی بہترین پاور سلوشنز اور بہترین سپورٹ فراہم کریں۔ ہماری برانڈ کی ساکھ سے فائدہ اٹھائیں اور ایک کامیاب کاروبار بنائیں۔',
        'Business opportunity': 'کاروباری موقع',
        'Diesel Generator': 'ڈیزل جنریٹر',
        'Power Distributor': 'پاور ڈسٹری بیوٹر',
        'Apply': 'درخواست دیں',
        'Opportunities': 'مواقع',
        'Profitable': 'منافع بخش',
        'High-growth': 'تیزی سے بڑھنے والا',
        'City': 'شہر',
        'Country': 'ملک',
        'State': 'ریاست',
        'Province': 'صوبہ',
        'Region': 'علاقہ',
        'Area': 'علاقہ',
        'Location': 'مقام',
        'Address': 'پتہ',
        'Email address': 'ای میل ایڈریس',
        'Phone number': 'فون نمبر',
        'Contact number': 'رابطہ نمبر',
        'Mobile': 'موبائل',
        'Telephone': 'ٹیلی فون',
        'Fax': 'فیکس',
        'Website': 'ویب سائٹ',
        'Social media': 'سوشل میڈیا',
        'Facebook': 'فیس بک',
        'Twitter': 'ٹویٹر',
        'LinkedIn': 'لنکڈ ان',
        'Instagram': 'انسٹاگرام',
        'YouTube': 'یوٹیوب',
        'WhatsApp': 'واٹس ایپ',
        'Telegram': 'ٹیلیگرام',
        'Skype': 'اسکائپ',
        'Zoom': 'زوم',
        'Microsoft Teams': 'مائیکروسافٹ ٹیمز',
        'Google Meet': 'گوگل میٹ',
        'Video call': 'ویڈیو کال',
        'Conference': 'کانفرنس',
        'Meeting': 'میٹنگ',
        'Appointment': 'اپائنٹمنٹ',
        'Schedule': 'شیڈول',
        'Calendar': 'کیلنڈر',
        'Reminder': 'یاد دہانی',
        'Notification': 'اطلاع',
        'Alert': 'الرٹ',
        'Message': 'پیغام',
        'SMS': 'ایس ایم ایس',
        'Text message': 'ٹیکسٹ میسج',
        'Voice message': 'وائس میسج',
        'Audio': 'آڈیو',
        'Video': 'ویڈیو',
        'Image': 'تصویر',
        'Photo': 'فوٹو',
        'Picture': 'تصویر',
        'Document': 'دستاویز',
        'File': 'فائل',
        'Folder': 'فولڈر',
        'Directory': 'ڈائرکٹری',
        'Path': 'پاتھ',
        'Link': 'لنک',
        'URL': 'یو آر ایل',
        'Hyperlink': 'ہائپر لنک',
        'Bookmark': 'بک مارک',
        'Favorite': 'پسندیدہ',
        'Like': 'پسند',
        'Share': 'شیئر',
        'Comment': 'تبصرہ',
        'Review': 'جائزہ',
        'Rating': 'ریٹنگ',
        'Feedback': 'فیڈ بیک',
        'Survey': 'سروے',
        'Poll': 'پول',
        'Vote': 'ووٹ',
        'Election': 'انتخابات',
        'Campaign': 'مہم',
        'Advertisement': 'اشتہار',
        'Marketing': 'مارکیٹنگ',
        'Promotion': 'پروموشن',
        'Discount': 'ڈسکاؤنٹ',
        'Offer': 'آفر',
        'Deal': 'ڈیل',
        'Sale': 'سیل',
        'Purchase': 'خریداری',
        'Buy': 'خریدیں',
        'Sell': 'بیچیں',
        'Trade': 'تجارت',
        'Business': 'کاروبار',
        'Commerce': 'تجارت',
        'Industry': 'صنعت',
        'Manufacturing': 'مینوفیکچرنگ',
        'Production': 'پیداوار',
        'Factory': 'فیکٹری',
        'Plant': 'پلانٹ',
        'Facility': 'سہولت',
        'Equipment': 'آلات',
        'Machinery': 'مشینری',
        'Technology': 'ٹیکنالوجی',
        'Innovation': 'جدت',
        'Research': 'تحقیق',
        'Development': 'ترقی',
        'Engineering': 'انجینئرنگ',
        'Design': 'ڈیزائن',
        'Architecture': 'فن تعمیر',
        'Construction': 'تعمیر',
        'Building': 'عمارت',
        'Structure': 'ڈھانچہ',
        'Infrastructure': 'بنیادی ڈھانچہ',
        'Network': 'نیٹ ورک',
        'System': 'سسٹم',
        'Platform': 'پلیٹ فارم',
        'Framework': 'فریم ورک',
        'Software': 'سافٹ ویئر',
        'Hardware': 'ہارڈ ویئر',
        'Computer': 'کمپیوٹر',
        'Laptop': 'لیپ ٹاپ',
        'Desktop': 'ڈیسک ٹاپ',
        'Mobile phone': 'موبائل فون',
        'Smartphone': 'اسمارٹ فون',
        'Tablet': 'ٹیبلٹ',
        'Device': 'ڈیوائس',
        'Gadget': 'گیجٹ',
        'Tool': 'ٹول',
        'Instrument': 'آلہ',
        'Machine': 'مشین',
        'Robot': 'روبوٹ',
        'Automation': 'آٹومیشن',
        'Artificial Intelligence': 'مصنوعی ذہانت',
        'AI': 'اے آئی',
        'Machine Learning': 'مشین لرننگ',
        'Deep Learning': 'ڈیپ لرننگ',
        'Neural Network': 'نیورل نیٹ ورک',
        'Algorithm': 'الگورتھم',
        'Programming': 'پروگرامنگ',
        'Coding': 'کوڈنگ',
        'Developer': 'ڈیولپر',
        'Programmer': 'پروگرامر',
        'Engineer': 'انجینئر',
        'Technician': 'ٹیکنیشن',
        'Specialist': 'ماہر',
        'Expert': 'ماہر',
        'Professional': 'پیشہ ور',
        'Consultant': 'مشیر',
        'Advisor': 'مشیر',
        'Manager': 'منیجر',
        'Director': 'ڈائریکٹر',
        'CEO': 'سی ای او',
        'President': 'صدر',
        'Chairman': 'چیئرمین',
        'Board': 'بورڈ',
        'Committee': 'کمیٹی',
        'Team': 'ٹیم',
        'Group': 'گروپ',
        'Department': 'شعبہ',
        'Division': 'ڈویژن',
        'Section': 'سیکشن',
        'Unit': 'یونٹ',
        'Branch': 'برانچ',
        'Office': 'دفتر',
        'Headquarters': 'ہیڈ کوارٹر',
        'Subsidiary': 'ذیلی کمپنی',
        'Partner': 'پارٹنر',
        'Client': 'کلائنٹ',
        'Customer': 'کسٹمر',
        'Consumer': 'صارف',
        'User': 'صارف',
        'Member': 'ممبر',
        'Subscriber': 'سبسکرائبر',
        'Follower': 'فالوور',
        'Fan': 'فین',
        'Supporter': 'حامی',
        'Sponsor': 'اسپانسر',
        'Investor': 'سرمایہ کار',
        'Shareholder': 'شیئر ہولڈر',
        'Stakeholder': 'اسٹیک ہولڈر',
        
        // Common words and phrases (no duplicates)
        'Hello': 'ہیلو',
        'World': 'دنیا',
        'Test': 'ٹیسٹ',
        'Testing': 'ٹیسٹنگ',
        'Company': 'کمپنی',
        'Service': 'خدمات',
        'Product': 'پروڈکٹ',
        'Quality': 'معیار',
        'Support': 'سپورٹ',
        'Contact': 'رابطہ',
        'Information': 'معلومات',
        'Email': 'ای میل',
        'Phone': 'فون',
        'Name': 'نام',
        'Price': 'قیمت',
        'Order': 'آرڈر',
        'Delivery': 'ڈیلیوری',
        'Payment': 'ادائیگی',
        'Account': 'اکاؤنٹ',
        'Login': 'لاگ ان',
        'Register': 'رجسٹر',
        'Submit': 'جمع کریں',
        'Cancel': 'منسوخ',
        'Save': 'محفوظ کریں',
        'Delete': 'ڈیلیٹ',
        'Edit': 'ایڈٹ',
        'Update': 'اپ ڈیٹ',
        'Search': 'تلاش',
        'Find': 'تلاش کریں',
        'Help': 'مدد',
        'About': 'کے بارے میں',
        'Home': 'ہوم',
        'Page': 'صفحہ',
        'Menu': 'مینو',
        'Settings': 'سیٹنگز',
        'Profile': 'پروفائل',
        'Dashboard': 'ڈیش بورڈ',
        'Reports': 'رپورٹس',
        'Analytics': 'تجزیات',
        'Statistics': 'شماریات',
        'Data': 'ڈیٹا',
        'Download': 'ڈاؤن لوڈ',
        'Upload': 'اپ لوڈ',
        'Import': 'امپورٹ',
        'Export': 'ایکسپورٹ',
        'Print': 'پرنٹ',
        'Copy': 'کاپی',
        'Paste': 'پیسٹ',
        'Cut': 'کٹ',
        'Undo': 'واپس',
        'Redo': 'دوبارہ',
        'Yes': 'ہاں',
        'No': 'نہیں',
        'OK': 'ٹھیک ہے',
        'Close': 'بند کریں',
        'Open': 'کھولیں',
        'New': 'نیا',
        'Create': 'بنائیں',
        'Add': 'شامل کریں',
        'Remove': 'ہٹائیں',
        'Select': 'منتخب کریں',
        'Choose': 'انتخاب کریں',
        'Options': 'اختیارات',
        'Tools': 'ٹولز',
        'Features': 'خصوصیات',
        'Benefits': 'فوائد',
        'Advantages': 'فوائد',
        'Solutions': 'حل',
        'Services': 'خدمات',
        'Products': 'پروڈکٹس',
        'Categories': 'کیٹگریز',
        'Items': 'اشیاء',
        'List': 'فہرست',
        'Table': 'جدول',
        'Chart': 'چارٹ',
        'Graph': 'گراف',
        'Content': 'مواد',
        'Article': 'مضمون',
        'Blog': 'بلاگ',
        'News': 'خبریں',
        'Events': 'واقعات',
        'Date': 'تاریخ',
        'Time': 'وقت',
        'Map': 'نقشہ',
        'Direction': 'سمت',
        'Distance': 'فاصلہ',
        'Speed': 'رفتار',
        'Size': 'سائز',
        'Weight': 'وزن',
        'Height': 'اونچائی',
        'Width': 'چوڑائی',
        'Length': 'لمبائی',
        'Color': 'رنگ',
        'Style': 'انداز',
        'Layout': 'لے آؤٹ',
        'Format': 'فارمیٹ',
        'Type': 'قسم',
        'Kind': 'نوع',
        'Model': 'ماڈل',
        'Version': 'ورژن',
        'Number': 'نمبر',
        'Code': 'کوڈ',
        'ID': 'آئی ڈی',
        'Key': 'کلید',
        'Value': 'قدر',
        'Amount': 'مقدار',
        'Total': 'کل',
        'Sum': 'مجموعہ',
        'Average': 'اوسط',
        'Maximum': 'زیادہ سے زیادہ',
        'Minimum': 'کم سے کم',
        'First': 'پہلا',
        'Last': 'آخری',
        'Next': 'اگلا',
        'Previous': 'پچھلا',
        'Start': 'شروع',
        'End': 'اختتام',
        'Begin': 'شروع کریں',
        'Finish': 'ختم کریں',
        'Complete': 'مکمل',
        'Done': 'ہو گیا',
        'Ready': 'تیار',
        'Available': 'دستیاب',
        'Online': 'آن لائن',
        'Offline': 'آف لائن',
        'Active': 'فعال',
        'Inactive': 'غیر فعال',
        'Enabled': 'فعال',
        'Disabled': 'غیر فعال',
        'Public': 'عوامی',
        'Private': 'نجی',
        'Secure': 'محفوظ',
        'Safe': 'محفوظ',
        'Protected': 'محفوظ',
        'Free': 'مفت',
        'Premium': 'پریمیم',
        'Basic': 'بنیادی',
        'Advanced': 'ایڈوانس',
        'Enterprise': 'انٹرپرائز',
        'Standard': 'معیاری',
        'Custom': 'کسٹم',
        'Special': 'خاص',
        'Limited': 'محدود',
        'Unlimited': 'لامحدود',
        'Full': 'مکمل',
        'Partial': 'جزوی',
        'Empty': 'خالی',
        'Loading': 'لوڈ ہو رہا ہے',
        'Processing': 'پروسیسنگ',
        'Connecting': 'کنکٹ ہو رہا ہے',
        'Connected': 'کنکٹ ہو گیا',
        'Disconnected': 'منقطع',
        'Error': 'خرابی',
        'Warning': 'انتباہ',
        'Success': 'کامیابی',
        'Failed': 'ناکام',
        'Completed': 'مکمل',
        'Pending': 'زیر التواء',
        'Approved': 'منظور',
        'Rejected': 'مسترد',
        'Cancelled': 'منسوخ',
        'Confirmed': 'تصدیق شدہ',
        'Verified': 'تصدیق شدہ',
        'Valid': 'درست',
        'Invalid': 'غلط',
        'Required': 'ضروری',
        'Optional': 'اختیاری',
        'Recommended': 'تجویز کردہ',
        'Popular': 'مقبول',
        'Featured': 'نمایاں',
        'Latest': 'تازہ ترین',
        'Recent': 'حالیہ',
        'Old': 'پرانا',
        'Archive': 'آرکائیو'
      },
      'spanish': {
        'Hello World': 'Hola Mundo',
        'This is test': 'Esta es una prueba',
        'Hello World, This is test': 'Hola Mundo, Esta es una prueba',
        'Welcome': 'Bienvenido',
        'Thank you': 'Gracias',
        'Good morning': 'Buenos días',
        'Good evening': 'Buenas tardes',
        'How are you?': '¿Cómo estás?',
        'What is your name?': '¿Cómo te llamas?',
        'I am fine': 'Estoy bien',
        'Please': 'Por favor',
        'Sorry': 'Lo siento',
        'Excuse me': 'Disculpe'
      },
      'french': {
        'Hello World': 'Bonjour le monde',
        'This is test': 'Ceci est un test',
        'Hello World, This is test': 'Bonjour le monde, Ceci est un test',
        'Welcome': 'Bienvenue',
        'Thank you': 'Merci',
        'Good morning': 'Bonjour',
        'Good evening': 'Bonsoir',
        'How are you?': 'Comment allez-vous?',
        'What is your name?': 'Comment vous appelez-vous?',
        'I am fine': 'Je vais bien',
        'Please': 'S\'il vous plaît',
        'Sorry': 'Désolé',
        'Excuse me': 'Excusez-moi'
      }
    };

    // Check if we have a mock translation for this text and language
    if (mockTranslations[targetLang] && mockTranslations[targetLang][sourceText]) {
      const translation = mockTranslations[targetLang][sourceText];
      console.log(`✅ Found translation: "${translation}"`);
      return translation;
    }

    // Try word-by-word translation for better results
    if (mockTranslations[targetLang]) {
      const translations = mockTranslations[targetLang];
      
      // Split into words and translate each
      const words = sourceText.split(/\s+/);
      const translatedWords = words.map(word => {
        // Clean the word (remove punctuation for matching)
        const cleanWord = word.replace(/[^\w]/g, '');
        const lowerCleanWord = cleanWord.toLowerCase();
        
        // Try exact match first
        if (translations[cleanWord]) {
          return translations[cleanWord];
        }
        
        // Try case-insensitive match
        for (const [key, value] of Object.entries(translations)) {
          if (key.toLowerCase() === lowerCleanWord) {
            return value;
          }
        }
        
        // Keep original if no translation found
        return word;
      });
      
      // Check if we translated at least some words
      const translationCount = translatedWords.filter((word, idx) => word !== words[idx]).length;
      
      if (translationCount > 0) {
        const wordTranslation = translatedWords.join(' ');
        console.log(`🔤 Word-by-word translation (${translationCount}/${words.length} words): "${wordTranslation}"`);
        return wordTranslation;
      }
      
      // Try to find the longest matching phrase
      const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (sourceText.toLowerCase().includes(key.toLowerCase()) && key.length > 3) {
          // Replace the matched phrase in the source text
          const regex = new RegExp(key, 'gi');
          const partialTranslation = sourceText.replace(regex, translations[key]);
          if (partialTranslation !== sourceText) {
            console.log(`🔍 Found phrase match: "${key}" → "${translations[key]}"`);
            return partialTranslation;
          }
        }
      }
    }

    // Enhanced fallback with better formatting
    if (targetLang === 'urdu') {
      // For Urdu, provide a more natural fallback
      const fallback = `${sourceText} (اردو ترجمہ)`;
      console.log(`⚠️ Using Urdu fallback: "${fallback}"`);
      return fallback;
    }

    // Generic fallback for other languages
    const fallback = `[Mock ${targetLang.charAt(0).toUpperCase() + targetLang.slice(1)} Translation] ${sourceText}`;
    console.log(`⚠️ Using generic fallback: "${fallback}"`);
    return fallback;
  }

  async evaluateQuality(prompt: string): Promise<string> {
    // Mock quality evaluation with random score
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    const hasViolations = score < 85;

    const result = {
      score,
      terminology_violations: hasViolations ? ['Mock terminology violation detected'] : [],
      suggestions: hasViolations ? ['Consider reviewing the translation for accuracy'] : [],
    };

    return JSON.stringify(result);
  }
}

// ============================================================================
// Provider Factory - Select provider based on environment
// ============================================================================

function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'mock':
    default:
      console.log('Using mock AI provider for testing');
      return new MockProvider();
  }
}

// ============================================================================
// Glossary Term Interface
// ============================================================================

export interface GlossaryTerm {
  source_term: string;
  target_term: string;
  description?: string;
}

// ============================================================================
// Main Translation Function with Glossary Support
// ============================================================================

/**
 * Translate text using AI with optional glossary terms
 * @param source_text - Text to translate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Optional glossary terms to enforce
 * @returns Translated text
 */
export async function translateWithAI(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<string> {
  // Build the translation prompt
  let prompt = `Translate the following text from ${source_lang} to ${target_lang}.\n`;
  prompt += `Use professional tone and maintain the original meaning.\n`;

  // Add glossary terms if provided
  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`;
      if (term.description) {
        prompt += ` (${term.description})`;
      }
      prompt += `\n`;
    });
  }

  prompt += `\nText:\n${source_text}`;

  // Get the configured AI provider and translate
  const provider = getAIProvider();
  const translatedText = await provider.translate(prompt);

  return translatedText;
}

// ============================================================================
// Legacy Functions (for backward compatibility)
// ============================================================================

/**
 * Translate text using AI service
 * @param text - Text to translate
 * @param sourceLang - Source language (optional, auto-detect if not provided)
 * @param targetLang - Target language
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLang: string | undefined,
  targetLang: string
): Promise<string> {
  return translateWithAI(text, sourceLang || 'auto', targetLang);
}

/**
 * Detect language of given text
 * @param text - Text to analyze
 * @returns Detected language code
 */
export async function detectLanguage(text: string): Promise<string> {
  // TODO: Implement actual language detection
  // For now, using a simple heuristic or mock detection
  
  console.log(`Detecting language for: ${text}`);
  
  // Mock detection (replace with actual API call)
  const mockDetectedLang = 'en';
  
  return mockDetectedLang;
}

// ============================================================================
// Utility: Build Translation Prompt
// ============================================================================

/**
 * Build a translation prompt with glossary terms
 * @param source_text - Source text
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Glossary terms
 * @returns Formatted prompt
 */
export function buildTranslationPrompt(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): string {
  let prompt = `Translate the following text from ${source_lang} to ${target_lang}.\n`;
  prompt += `Use professional tone and maintain the original meaning.\n`;

  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`;
      if (term.description) {
        prompt += ` (${term.description})`;
      }
      prompt += `\n`;
    });
  }

  prompt += `\nText:\n${source_text}`;

  return prompt;
}

// ============================================================================
// Translation Quality Evaluation
// ============================================================================

/**
 * Evaluate translation quality using AI
 * @param source_text - Original source text
 * @param translated_text - Translated text to evaluate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Glossary terms that should be followed
 * @returns Quality evaluation with score, violations, and suggestions
 */
export async function evaluateTranslationQuality(
  source_text: string,
  translated_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<QualityEvaluation> {
  // Build evaluation prompt
  let prompt = `Evaluate the quality of this translation from ${source_lang} to ${target_lang}.\n\n`;
  
  prompt += `Source Text (${source_lang}):\n${source_text}\n\n`;
  prompt += `Translated Text (${target_lang}):\n${translated_text}\n\n`;
  
  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `Required Glossary Terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Evaluate the translation and return a JSON object with this exact structure:\n`;
  prompt += `{\n`;
  prompt += `  "score": <number from 0 to 100>,\n`;
  prompt += `  "terminology_violations": [<array of strings describing any glossary term violations>],\n`;
  prompt += `  "suggestions": [<array of strings with improvement suggestions if score < 85>]\n`;
  prompt += `}\n\n`;
  
  prompt += `Scoring criteria:\n`;
  prompt += `- 95-100: Perfect translation, no errors\n`;
  prompt += `- 85-94: Good translation, minor improvements possible\n`;
  prompt += `- 70-84: Acceptable but needs improvement\n`;
  prompt += `- Below 70: Poor translation, significant issues\n\n`;
  
  prompt += `Check for:\n`;
  prompt += `1. Accuracy: Does it convey the same meaning?\n`;
  prompt += `2. Fluency: Is it natural in the target language?\n`;
  prompt += `3. Terminology: Are glossary terms used correctly?\n`;
  prompt += `4. Grammar: Are there any grammatical errors?\n`;
  prompt += `5. Style: Is the tone and style appropriate?\n\n`;
  
  prompt += `Return ONLY the JSON object, no additional text or markdown formatting.`;

  try {
    const provider = getAIProvider();
    const evaluationResult = await provider.evaluateQuality(prompt);
    
    // Parse the JSON response
    let parsedResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResult = evaluationResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Failed to parse quality evaluation result:', evaluationResult);
      // Return a default evaluation if parsing fails
      return {
        score: 75,
        terminology_violations: [],
        suggestions: ['Quality evaluation parsing failed. Manual review recommended.'],
        passed: false,
      };
    }
    
    // Ensure score is within valid range
    const score = Math.max(0, Math.min(100, parsedResult.score || 75));
    
    return {
      score,
      terminology_violations: parsedResult.terminology_violations || [],
      suggestions: parsedResult.suggestions || [],
      passed: score >= 85,
    };
  } catch (error) {
    console.error('Quality evaluation error:', error);
    // Return a default evaluation on error
    return {
      score: 75,
      terminology_violations: [],
      suggestions: ['Quality evaluation failed. Manual review recommended.'],
      passed: false,
    };
  }
}

/**
 * Translate text with automatic quality evaluation
 * @param source_text - Text to translate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Optional glossary terms
 * @returns Object with translated text and quality evaluation
 */
export async function translateWithQuality(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<{ translated_text: string; quality: QualityEvaluation }> {
  // First, translate the text
  const translated_text = await translateWithAI(source_text, source_lang, target_lang, glossary_terms);
  
  // Then, evaluate the quality
  const quality = await evaluateTranslationQuality(
    source_text,
    translated_text,
    source_lang,
    target_lang,
    glossary_terms
  );
  
  return {
    translated_text,
    quality,
  };
}