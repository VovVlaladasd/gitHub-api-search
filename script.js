// Элементы DOM
const searchInput = document.querySelector("#search");
const autocompleteList = document.querySelector("#autocomplete");
const reposList = document.querySelector("#reposList");

// Функция Debounce
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Запрос к GitHub API
async function fetchRepos(query) {
  if (!query) {
    autocompleteList.style.display = "none";
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`
    );

    // Проверка на ошибки HTTP и лимиты API
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Превышен лимит запросов к GitHub API. Попробуйте позже.");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    renderAutocomplete(data.items || []);
  } catch (error) {
    console.error("Ошибка запроса к GitHub:", error);
    autocompleteList.innerHTML = `<li style="padding:10px;color:#red">${error.message}</li>`;
    autocompleteList.style.display = "block";
  }
}

// Подсказки автокомплита
function renderAutocomplete(repos) {
  autocompleteList.innerHTML = "";

  if (!repos.length) {
    autocompleteList.style.display = "none";
    return;
  }

  repos.forEach(repo => {
    const li = document.createElement("li");
    li.textContent = repo.full_name;
    li.dataset.json = JSON.stringify(repo); // сохранение данных для использования

    li.addEventListener("click", () => {
      addRepoToList(repo);
      searchInput.value = "";           // очистка поля ввода
      autocompleteList.style.display = "none"; // скрытие подсказок
      searchInput.focus();              // фокусируемся на поле
    });

    autocompleteList.appendChild(li);
  });

  autocompleteList.style.display = "block";
}

// Добавление репозитория в список
function addRepoToList(repo) {
  // Проверка на дубликаты
  const existing = Array.from(reposList.children).find(
    item => item.dataset.fullName === repo.full_name
  );
  if (existing) {
    return;
  }

  const li = document.createElement("li");
  li.className = "repo-item";
  li.dataset.fullName = repo.full_name;

  li.innerHTML = `
    <div>
      <b></b><br>
      <span class="owner"></span><br>
      <span class="stars"></span>
    </div>
    <a href="#" class="del_btn" title="Удалить">✕</a>
  `;

  // Заполнение данных
  li.querySelector("b").textContent = repo.name;
  li.querySelector(".owner").textContent = `владелец: ${repo.owner.login}`;
  li.querySelector(".stars").textContent = `⭐${repo.stargazers_count}`;

  // Удаление репозитория
  li.querySelector(".del_btn").addEventListener("click", (e) => {
    e.preventDefault();
    li.remove();
  });

  reposList.appendChild(li);
}

// Подключение обработчика с debounce
const debouncedFetch = debounce(() => {
  const query = searchInput.value.trim();
  fetchRepos(query);
}, 400);

searchInput.addEventListener("input", debouncedFetch);

// Закрытие автокомплита при клике вне поля
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    autocompleteList.style.display = "none";
  }
});
