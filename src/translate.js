import axios from "axios";
import fs from "fs";
import path from "path";

const requestTranslation = async (url, encodedText, lang) => {
    const response = await axios.get(`${url}&from=pt&to=${lang}&text=${encodedText}`);
    return response.data;
}

const getTranlation = (tranlationObject) => {
    if (tranlationObject.translations) {
        if (tranlationObject.translations.pronoun) return Object.keys(tranlationObject.translations.pronoun)[0];
        if (tranlationObject.translations.verb) return Object.keys(tranlationObject.translations.verb)[0];

        return Object.keys(tranlationObject.translations)[0];
    }

    return tranlationObject['translated-text'];
}

const simplyTranslateApi = async (text) => {
    const encodedText = encodeURI(text);
    const translateURL = "https://simplytranslate.org/api/translate/?engine=google";

    const enTrad = await requestTranslation(translateURL, encodedText, 'en');
    const esTrad = await requestTranslation(translateURL, encodedText, 'es');

    const translations = {
        pt: text,
        en: getTranlation(enTrad),
        es: getTranlation(esTrad)
    }

    return translations;
}

const getLastIndexFromFile = (filePath) => {
    const buffer = fs.readFileSync(filePath);

    const translationObject = (buffer.length > 0) ? JSON.parse(buffer) : {};

    const tranlationKeys = Object.keys(translationObject);
    if (tranlationKeys.length < 1) return -1;

    const lastIndex = tranlationKeys[tranlationKeys.length - 1];

    return Number(lastIndex);
};

const addTranlationToFile = (filePath, text, actualIndex) => {
    const buffer = fs.readFileSync(filePath);

    const registredtranslations = (buffer.length > 0) ? buffer.toString() : "{\n}";

    const indexOfLastBrace = registredtranslations.lastIndexOf('}')
    const removedLastBrace = registredtranslations.substring(0, indexOfLastBrace - 1)
    const newTranlation = `${removedLastBrace}\n  ,"${actualIndex}": "${text}"\n`;

    const withBraces = `${newTranlation}}\n`

    fs.writeFileSync(filePath, withBraces);
}

const addtranslationsToFiles = (tranlation, translationsPath, lastIndex) => {
    const translationFiles = {
        pt: 'PT.json',
        en: 'EN.json',
        es: 'ES.json'
    };

    const actualIndex = lastIndex ?
        Number(lastIndex) + 1 :
        getLastIndexFromFile(translationsPath + '/PT.json') + 1;

    Object.keys(translationFiles).forEach(lang => {
        const filePath = `/${translationFiles[lang]}`;
        addTranlationToFile(translationsPath + filePath, tranlation[lang], actualIndex);
    })

    return actualIndex;
}

const getArgs = (arg) => {
    const processArgs = process.argv.slice(2);
    const argIndex = processArgs.indexOf(arg);

    if (argIndex === -1) return;

    return processArgs[argIndex + 1];
}

const getArgFlag = (arg) => {
    const processArgs = process.argv.slice(2);
    const argIndex = processArgs.indexOf(arg);

    return (argIndex === -1) ? false : true;
}

async function main() {
    const text = getArgs('-t');
    const lastIndex = getArgs('-l');
    const tFilesPath = getArgs('-p');

    const helpCommand = getArgFlag('-h');

    if (helpCommand) {
        console.log('-t "mensagem a ser traduzida" (obrigatorio)');
        console.log('-p "caminho para a pasta onde contem arquivos de tradução ex: src/translations" (opcional)');
        console.log('-l "passa como parametro o ultimo índice para incrementar nas traduções" (opcional)');
        return
    }

    if (!text && !helpCommand) {
        console.error('Parametros invalidos');
        console.error('Use -h para ver comandos');
        return
    }

    const translation = await simplyTranslateApi(text);
    console.table(translation);

    if (tFilesPath) {
        const translationsPath = path.resolve(tFilesPath);
        const actualIndex = addtranslationsToFiles(translation, translationsPath, lastIndex);

        console.log(`Last Index: ${actualIndex}`);
    }
}

main();
