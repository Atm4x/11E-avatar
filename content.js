// URL для замены href
const REPLACEMENT_URL = "https://i.pinimg.com/originals/c1/2a/2e/c12a2e96ef5fdd39935cca777bc32235.png";

// API базовый URL
const API_BASE_URL = 'https://school.tubik-corp.ru';

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

// Функция для замены href и модификации SVG
async function replaceImageHref() {
    const images = document.querySelectorAll('image[clip-path]');

    for (const img of images) {
        const currentHref = img.getAttribute('href');
        
        if (currentHref.startsWith(API_BASE_URL)) {
            continue;
        }

        const clipPath = img.getAttribute('clip-path');
        const regex = /url\(#clip-main-([a-f0-9\-]+)\)/i;
        const match = clipPath.match(regex);

        if (match && match[1]) {
            const personId = match[1];
            try {
                const parentG = img.closest('g');

                // Удаляем circle, если он есть
                const circle = parentG.querySelector('circle');
                if (circle) {
                    circle.remove();
                }

                const personData = await getPersonData(personId);

                let newHref;
                if (personData && !personData.is_hidden) {
                    newHref = `${API_BASE_URL}${personData.avatar_url}`;
                } else {
                    newHref = REPLACEMENT_URL;
                }

                if(currentHref.startsWith(REPLACEMENT_URL))
                    continue;

                // Получаем текущие координаты
                const currentX = parseFloat(img.getAttribute('x') || '0');
                const currentY = parseFloat(img.getAttribute('y') || '0');

                // Устанавливаем новые размеры (42x42) и обновляем координаты
                const newSize = 42;
                const newX = currentX - (newSize - parseFloat(img.getAttribute('width'))) / 2;
                const newY = currentY - (newSize - parseFloat(img.getAttribute('height'))) / 2;

                img.setAttribute('width', newSize.toString());
                img.setAttribute('height', newSize.toString());
                img.setAttribute('x', newX.toString());
                img.setAttribute('y', newY.toString());

                // Обновляем href
                img.setAttribute('href', newHref);

                
                // Создаем новый clipPath
                const clipPathId = `clip-main-${personId}`;
                const newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
                newClipPath.setAttribute('id', clipPathId);

                const clipCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                clipCircle.setAttribute('cx', '21');
                clipCircle.setAttribute('cy', '21');
                clipCircle.setAttribute('r', '21');

                newClipPath.appendChild(clipCircle);
                parentG.appendChild(newClipPath);
                img.setAttribute('clip-path', `url(#${clipPathId})`);

                // Добавляем обработчик клика на родительский элемент G
                parentG.style.cursor = 'pointer';
                parentG.onclick = async function() {
                    const images = this.querySelectorAll('image');
                    try {
                        const peopleData = await Promise.all(
                            Array.from(images).map(async (img) => {
                                const clipPath = img.getAttribute('clip-path');
                                const match = clipPath.match(/url\(#clip-main-([a-f0-9\-]+)\)/i);
                                if (match && match[1]) {
                                    return await getPersonData(match[1]);
                                }
                                return null;
                            })
                        );
                        const validPeopleData = peopleData.filter(person => person !== null);
                        const content = createPanelContent(validPeopleData);
                        showInfoPanel(content);
                    } catch (error) {
                        console.error('Error fetching people data:', error);
                        showInfoPanel('<p>Произошла ошибка при загрузке данных.</p>');
                    }
                };

                console.log(`Обновлено изображение для personId: ${personId}`);
            } catch (error) {
                console.error(`Ошибка при обработке изображения для personId: ${personId}`, error);
                // Устанавливаем изображение по умолчанию в случае ошибки
                img.setAttribute('href', REPLACEMENT_URL);
            }
        }
    }
}

async function getPersonData(personId) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: "getPersonData", personId: personId}, response => {
            if (response.error) {
                console.error('Error fetching person data:', response.error);
                reject(new Error(response.error));
            } else {
                // Декодирование Unicode-экранированных строк
                const decodeName = decodeURIComponent(JSON.parse('"' + response.name.replace(/\"/g, '\\"') + '"'));
                const decodeSurname = decodeURIComponent(JSON.parse('"' + response.surname.replace(/\"/g, '\\"') + '"'));
                const decodePatronymic = decodeURIComponent(JSON.parse('"' + response.patronymic.replace(/\"/g, '\\"') + '"'));

                resolve({
                    id: response.person_id,
                    name: decodeName,
                    surname: decodeSurname,
                    patronymic: decodePatronymic,
                    avatar_url: response.avatar_url,
                    is_hidden: response.is_hidden
                });
            }
        });
    });
}


// Функция для запуска с задержкой
function delayedReplace() {
    setTimeout(replaceImageHref, 500);
}

// Запуск при полной загрузке страницы
// Запуск при полной загрузке страницы
function onPageLoad() {
    // Проверяем и заменяем изображения один раз при загрузке страницы
    delayedReplace();

    // Создаем MutationObserver для отслеживания изменений в DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const images = node.querySelectorAll('image[clip-path]');
                        if (images.length > 0) {
                            delayedReplace();
                        }
                    }
                });
            }
        });
    });

    // Настройка и запуск MutationObserver
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
}


// Добавим стили для панели и затемнения
const styles = `
  .info-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 1000;
    max-width: 500px;
    width: 90%;
    max-height: 80%;
    overflow: hidden; /* Изменено с auto на hidden */
    display: none;
    font-family: Arial, sans-serif;
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 999;
    display: none;
  }
  .slider {
    display: flex;
    overflow: hidden; /* Изменено с auto на hidden */
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
  }
  .slide {
    flex: 0 0 100%;
    scroll-snap-align: start;
    padding: 20px;
    box-sizing: border-box;
  }
  .profile {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .profile img {
    border-radius: 50%;
    width: 100px;
    height: 100px;
    object-fit: cover;
  }
  .profile-details {
    flex: 1;
  }
  .profile-details h2 {
    margin: 0 0 10px 0;
    font-size: 1.5em;
    color: #333;
  }
  .profile-details p {
    margin: 5px 0;
    color: #555;
  }
  .slider-buttons {
    text-align: center;
    margin-top: 15px;
  }
  .slider-buttons button {
    background: #007BFF;
    border: none;
    color: white;
    padding: 8px 12px;
    margin: 0 5px;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
    font-size: 14px;
  }
  .slider-buttons button:hover {
    background: #0056b3;
  }
`;

// Добавляем стили на страницу
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

// Функция для создания панели
function createInfoPanel() {
  const panel = document.createElement('div');
  panel.className = 'info-panel';
  document.body.appendChild(panel);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', () => {
    hideInfoPanel();
  });

  return panel;
}

// Функция для отображения панели
function showInfoPanel(content) {
  const panel = document.querySelector('.info-panel') || createInfoPanel();
  const overlay = document.querySelector('.overlay');

  panel.innerHTML = content;
  panel.style.display = 'block';
  overlay.style.display = 'block';

  // Анимация появления
  panel.animate([
    { opacity: 0, transform: 'translate(-50%, -60%)' },
    { opacity: 1, transform: 'translate(-50%, -50%)' }
  ], {
    duration: 200,
    easing: 'ease-out'
  });

  overlay.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], {
    duration: 200
  });
}

// Функция для скрытия панели
function hideInfoPanel() {
    const panel = document.querySelector('.info-panel');
    const overlay = document.querySelector('.overlay');
  
    if (panel && overlay) {
      panel.style.display = 'none';
      overlay.style.display = 'none';
    }
  }

// Функция для создания содержимого панели
function createPanelContent(peopleData) {
    if (peopleData.length === 0) {
        return '<p>Нет доступной информации.</p>';
    }

    if (peopleData.length === 1) {
        const person = peopleData[0];
        return `
            <div class="profile">
                <img src="${API_BASE_URL}${person.avatar_url}" alt="Avatar">
                <div class="profile-details">
                    <h2>${person.surname} ${person.name} ${person.patronymic || ''}</h2>
                    <p><strong>ID:</strong> ${person.id}</p>
                    <p><strong>Скрыт:</strong> ${person.is_hidden ? 'Да' : 'Нет'}</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="slider">
            ${peopleData.map((person) => `
                <div class="slide">
                    <div class="profile">
                        <img src="${API_BASE_URL}${person.avatar_url}" alt="Avatar">
                        <div class="profile-details">
                            <h2>${person.surname} ${person.name} ${person.patronymic || ''}</h2>
                            <p><strong>ID:</strong> ${person.id}</p>
                            <p><strong>Скрыт:</strong> ${person.is_hidden ? 'Да' : 'Нет'}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="slider-buttons">
            ${peopleData.map((_, index) => `
                <button data-index="${index}">${index + 1}</button>
            `).join('')}
        </div>
    `;
}


document.addEventListener('click', function(event) {
    if (event.target.matches('.slider-buttons button')) {
        const index = parseInt(event.target.getAttribute('data-index'), 10);
        const slider = document.querySelector('.slider');
        if (slider) {
            const panelWidth = document.querySelector('.info-panel').clientWidth;
            slider.scrollTo({
                left: index * panelWidth,
                behavior: 'smooth'
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', onPageLoad);
window.addEventListener('load', onPageLoad);


