// URL для замены href
const REPLACEMENT_URL = "https://cdn.openart.ai/stable_diffusion/530c0e4f07723a4686b2330a5d95ce5d427d44f9_2000x2000.webp";

// API базовый URL
const API_BASE_URL = 'https://tubik-corp.ru';

// Функция для получения данных о персоне по personId
async function getPersonData(personId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({action: "getPersonData", personId: personId}, response => {
        if (response && !response.error) {
          resolve(response);
        } else {
          console.log(`Не удалось получить данные для personId: ${personId}`);
          resolve(null);
        }
      });
    });
  }

// Функция для замены href
async function replaceImageHref() {
    // Поиск всех тегов <image> с атрибутом clip-path
    const images = document.querySelectorAll('image[clip-path]');

    for (const img of images) {
        const clipPath = img.getAttribute('clip-path');
        const regex = /url\(#clip-main-([a-f0-9\-]+)\)/i;
        const match = clipPath.match(regex);

        if (match && match[1]) {
            const personId = match[1];
            const personData = await getPersonData(personId);

            if (personData && !personData.is_hidden) {
                const currentHref = img.getAttribute('href');
                const newHref = `${API_BASE_URL}${personData.avatar_url}`;

                if (currentHref !== newHref) {
                    img.setAttribute('href', newHref);
                    console.log(`Заменён href для image с personId: ${personId}`);
                }
            } else if (personData && personData.is_hidden) {
                // Если персона скрыта, используем дефолтное изображение
                img.setAttribute('href', REPLACEMENT_URL);
                console.log(`Использовано дефолтное изображение для скрытого personId: ${personId}`);
            }
        }
    }
}

// Запуск при полной загрузке страницы
function onPageLoad() {
    // Первая проверка после загрузки страницы
    replaceImageHref();

    // Устанавливаем интервал проверки каждые 10 секунд
    setInterval(replaceImageHref, 10000); // 10000 мс = 10 секунд
}

document.addEventListener('DOMContentLoaded', onPageLoad);
window.addEventListener('load', onPageLoad);