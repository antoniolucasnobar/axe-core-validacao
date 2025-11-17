const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs").promises;

async function executarPassos(page, passos) {
  if (Array.isArray(passos) && passos.length > 0) {
    for (const passo of passos) {
      if (passo.action === "click") {
        await page.click(passo.selector);
      } else if (passo.action === "type") {
        await page.fill(passo.selector, passo.value);
      } else if (passo.action === "waitForSelector") {
        await page.waitForSelector(passo.selector);
      } else if (passo.action === "waitForTimeout") {
        await page.waitForTimeout(passo.timeout);
      }
      await page.waitForLoadState("networkidle");
    }
  }
}

async function getBrowser(browserName, headless = false) {
  let browser;
  if (browserName === "chromium") {
    browser = await chromium.launch({ headless });
  } else if (browserName === "edge") {
    browser = await chromium.launch({ channel: "msedge", headless });
  } else if (browserName === "firefox") {
    browser = await firefox.launch({ headless });
  } else if (browserName === "webkit") {
    browser = await webkit.launch({ headless });
  } else {
    throw new Error("Navegador não suportado");
  }
  return browser;
}

/**
 * Realiza login se necessário
 * @param {*} page objeto do playwright
 * @param {*} config configuracao do projeto
 */
async function login(page, config) {
  if (config.login && config.login.enabled) {
    await page.goto(config.dominio + config.login.url);
    await page.fill(config.login.fields.usuario, config.login.dados.usuario);
    await page.fill(config.login.fields.senha, config.login.dados.senha);
    if (config.login.submitSelector) {
      await page.click(config.login.submitSelector);
    } else {
      await page.keyboard.press("Enter");
    }
    await page.waitForNavigation();
  }
}

async function abrirPagina(page, url) {
  await page.goto(url);
  // aguarda as apis carregarem.
  await page.waitForLoadState("networkidle");
}

async function analisar(page, results, id) {
  const axe = new AxeBuilder({ page });
  // axe.withTags(wcagLevel);
  const result = await axe.analyze();
  results[id] = result.violations;
  console.log(`Violacoes em ${id}: ${result.violations.length}`);
}

async function runWithConfig(
  configPath,
  browserName = "chromium",
  wcagLevel = ["wcag22a", "wcag22aa", "wcag22aaa"] // nao usado porque muitas violações não estão com as tags wcag
) {
  let browser = await getBrowser(browserName);

  const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page, config);

  // Validação das páginas configuradas
  const results = {};

  if (config.cenarios) {
    for (const cenario of config.cenarios) {
      const url = config.dominio + cenario.path;
      const id = `${cenario.path} (${cenario.id})`;
      await abrirPagina(page, url);
      await executarPassos(page, cenario?.beforeAnalyze);
      await analisar(page, results, id);
    }
  }

  if (config.paginas) {
    for (const path of config.paginas) {
      const url = config.dominio + path;
      const id = path;
      await abrirPagina(page, url);
      await analisar(page, results, id);
    }
  }
  await browser.close();
  await fs.writeFile(
    "resultado-validacao.json",
    JSON.stringify(results, null, 2)
  );
}

runWithConfig("config.json", "edge");
