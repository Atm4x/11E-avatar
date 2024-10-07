// URL для замены href
const REPLACEMENT_URL = "https://www.pngplay.com/wp-content/uploads/12/Anime-Girl-Pfp-PNG-HD-Quality.png";

// Массив KNOWN_IDS (вставьте сюда ваши personId через запятую)
const KNOWN_IDS = [
    "1f1bb542-5f05-4732-8e38-94cf032b785f",
    "b7c71392-304f-4260-9282-646fb5946f6a",
    "fe00cab5-c5d1-48ca-a7a6-3ea6a73cf873",
    "5bd80a80-cab2-47bc-90db-ac8249bd7d1a",
    "d0929dbe-930f-4008-a70c-89c61f7036a1",
    "f20bd0c1-ae20-4743-9589-790ff6be18d5",
    "81064207-a219-4571-8ca2-b3a7a453453a",
    "c00dfbef-c40f-4a16-9a17-23616c86f44d",
    "1231851c-8e72-47ac-8ed3-c357f3554ea8",
    "fdcf478e-8939-4c2c-ad42-999954b3e775",
    "01b3a755-03ca-45cb-9b70-651b0eeb7232",
    "5d8d9ce7-9cb1-4864-949d-395f2be995a8",
    "eea2000b-1a3e-4f38-a91b-d04c21dd4460",
    "56dcada0-ebb8-4ae5-9421-c8c38c14828d",
    "c182717b-8f23-4752-89cf-706bbbce6a3e",
    "e30d99fc-4c1c-44e4-97e0-cc5bae8b3b53",
    "d30a059f-25a6-4847-a46f-25e626d3897a",
    "a492a6e5-92de-4256-9255-9ff684fad2db",
    "6bf45362-3b56-40b1-85ec-76bd658bad17",
    "80e57326-72ae-4f60-9859-d089192f0f05",
    "7c7036f9-9a7b-4717-839b-b25eda15d447",
    "fecdc16c-9c5d-4727-ae29-0236991456e9",
    "8902f8e9-0b54-4db0-bfb1-be305681e74e",
    "4fe15154-403a-4395-b3fa-11ae50291e9b",
    "b545aa94-0efe-484f-9666-d230c6158e41",
    "08e7369b-d330-4dcf-abfd-f530fe22fc6f",
    "1e48d483-24e5-4b24-b7d2-f1acc3e50ebc",
    "ad9658bd-4766-4e7d-bc82-06069b153d4d",
    "101a25ce-5b5a-48a2-99b7-6933d8c3562a",
    "a7630098-558b-4ae4-a7aa-5d6e16ea55f5",
    "13909977-8713-4dac-b5d1-f6068a5d6e25"
];

const knownIdsSet = new Set(KNOWN_IDS);

// Функция для замены href
function replaceImageHref() {
    // Поиск всех тегов <image> с атрибутом clip-path
    const images = document.querySelectorAll('image[clip-path]');
    images.forEach(img => {
        const clipPath = img.getAttribute('clip-path');
        const regex = /url\(#clip-main-([a-f0-9\-]+)\)/i;
        const match = clipPath.match(regex);
        if (match && match[1]) {
            const knownId = match[1];
            if (knownIdsSet.has(knownId)) {
                // Проверяем, не изменён ли уже href
                const currentHref = img.getAttribute('href');
                if (currentHref !== REPLACEMENT_URL) {
                    img.setAttribute('href', REPLACEMENT_URL);
                    console.log(`Заменён href для image с KNOWN_ID: ${knownId}`);
                }
            }
        }
    });
}

// Запуск при полной загрузке страницы
function onPageLoad() {
    // Первая проверка после загрузки страницы
    replaceImageHref();

    // Устанавливаем интервал проверки каждые 10 секунд
    setInterval(replaceImageHref, 2000); // 10000 мс = 10 секунд
}

document.addEventListener('DOMContentLoaded', onPageLoad);
window.addEventListener('load', onPageLoad);