interface LanguageInfo {
    currentLanguage: string;
    fallbackLanguage: string;
}

class MultiText {
    private texts: Dictionary<string>;

    constructor(data: any) {
        this.texts = data.Texts;
    }

    getText(language: LanguageInfo): string {
        let text = this.texts[language.currentLanguage] || this.texts[language.fallbackLanguage];
        if (!text) {
            throw new FlyfoxError(`Cannot find text for selected language (${language.currentLanguage} or for fallback language ${language.fallbackLanguage})`);
        }

        return text;
    }
}