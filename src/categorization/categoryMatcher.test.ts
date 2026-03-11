import { describe, expect, it } from "vitest";
import { matchCategory, resolveAICategory } from "./categoryMatcher.js";

describe("matchCategory — alimentação", () => {
  it.each([
    "pizza", "ifood", "uber eats", "ubereats", "rappi", "restaurante",
    "lanche", "almoco", "almoço", "jantar", "cafe", "cafezinho",
    "padaria", "marmita", "sushi", "hamburguer", "mcdonalds",
    "burguer king", "pastel", "coxinha", "acai", "açaí", "sorvete",
    "churrasco", "tapioca",
  ])('"%s" → alimentação', (desc) => {
    expect(matchCategory(desc)).toBe("alimentação");
  });
});

describe("matchCategory — mercado", () => {
  it.each([
    "mercado", "supermercado", "feira", "carrefour", "extra",
    "atacadao", "pao de acucar", "hortifruti", "acougue",
    "compras da semana", "rancho", "arroz", "feijao",
  ])('"%s" → mercado', (desc) => {
    expect(matchCategory(desc)).toBe("mercado");
  });
});

describe("matchCategory — transporte", () => {
  it.each([
    "uber", "99", "taxi", "onibus", "metro", "gasolina",
    "combustivel", "posto", "estacionamento", "pedagio",
    "passagem", "oficina", "borracharia",
  ])('"%s" → transporte', (desc) => {
    expect(matchCategory(desc)).toBe("transporte");
  });
});

describe("matchCategory — saúde", () => {
  it.each([
    "farmacia", "drogaria", "drogasil", "remedios", "remedio",
    "medicamento", "vitamina", "suplemento", "whey", "medico",
    "consulta", "dentista", "exame", "academia", "fisioterapia",
    "terapia", "psicologo", "oculos", "otica",
  ])('"%s" → saúde', (desc) => {
    expect(matchCategory(desc)).toBe("saúde");
  });
});

describe("matchCategory — moradia", () => {
  it.each([
    "aluguel", "condominio", "iptu", "agua", "luz", "energia",
    "gas", "botijao", "internet", "manutencao", "encanador",
    "eletricista", "faxineira", "produtos de limpeza", "geladeira", "fogao",
  ])('"%s" → moradia', (desc) => {
    expect(matchCategory(desc)).toBe("moradia");
  });
});

describe("matchCategory — educação", () => {
  it.each([
    "escola", "faculdade", "mensalidade", "curso", "udemy", "alura",
    "livro", "material escolar", "ingles",
  ])('"%s" → educação', (desc) => {
    expect(matchCategory(desc)).toBe("educação");
  });
});

describe("matchCategory — lazer", () => {
  it.each([
    "netflix", "spotify", "disney", "cinema", "show",
    "viagem", "hotel", "airbnb", "cerveja", "vinho", "game", "steam",
  ])('"%s" → lazer', (desc) => {
    expect(matchCategory(desc)).toBe("lazer");
  });
});

describe("matchCategory — vestuário", () => {
  it.each([
    "roupa", "tenis", "sapato", "camisa", "calca", "zara", "renner", "shein",
  ])('"%s" → vestuário', (desc) => {
    expect(matchCategory(desc)).toBe("vestuário");
  });
});

describe("matchCategory — pet", () => {
  it.each([
    "pet shop", "petshop", "veterinario", "racao", "banho tosa",
  ])('"%s" → pet', (desc) => {
    expect(matchCategory(desc)).toBe("pet");
  });
});

describe("matchCategory — beleza", () => {
  it.each([
    "salao", "cabelo", "barbearia", "manicure", "depilacao",
    "maquiagem", "shampoo", "skincare",
  ])('"%s" → beleza', (desc) => {
    expect(matchCategory(desc)).toBe("beleza");
  });
});

describe("matchCategory — tecnologia", () => {
  it.each([
    "celular", "notebook", "iphone", "tim", "recarga", "fone", "carregador",
  ])('"%s" → tecnologia', (desc) => {
    expect(matchCategory(desc)).toBe("tecnologia");
  });
});

describe("matchCategory — finanças", () => {
  it.each([
    "taxa", "juros", "emprestimo", "parcela", "fatura", "seguro", "investimento",
  ])('"%s" → finanças', (desc) => {
    expect(matchCategory(desc)).toBe("finanças");
  });
});

describe("matchCategory — renda", () => {
  it.each([
    ["salario empresa", "income"],
    ["recebi salario", "income"],
    ["freelance projeto", "income"],
    ["bonus trimestral", "income"],
    ["13 salario", "income"],
  ] as [string, "income"][])('"%s" (income) → renda', (desc, type) => {
    expect(matchCategory(desc, type)).toBe("renda");
  });
});

describe("matchCategory — fallback outros", () => {
  it.each(["coisa aleatoria xyz", "presente surpresa", "mimo"])(
    '"%s" → outros',
    (desc) => {
      expect(matchCategory(desc, "expense")).toBe("outros");
    },
  );
});

describe("matchCategory — descrições compostas (cenários reais)", () => {
  it("pizza delivery → alimentação", () => {
    expect(matchCategory("pizza delivery")).toBe("alimentação");
  });
  it("mercado sabado → mercado", () => {
    expect(matchCategory("mercado sabado")).toBe("mercado");
  });
  it("uber app → transporte", () => {
    expect(matchCategory("uber app")).toBe("transporte");
  });
  it("consulta medico → saúde", () => {
    expect(matchCategory("consulta medico")).toBe("saúde");
  });
  it("internet casa → moradia", () => {
    expect(matchCategory("internet casa")).toBe("moradia");
  });
  it("banho tosa → pet", () => {
    expect(matchCategory("banho tosa")).toBe("pet");
  });
  it("cabelo salao → beleza", () => {
    expect(matchCategory("cabelo salao")).toBe("beleza");
  });
});

describe("matchCategory — acentos e variações de case", () => {
  it("café → alimentação", () => {
    expect(matchCategory("café")).toBe("alimentação");
  });
  it("ônibus → transporte", () => {
    expect(matchCategory("ônibus")).toBe("transporte");
  });
  it("UBER → transporte", () => {
    expect(matchCategory("UBER")).toBe("transporte");
  });
  it("Farmácia → saúde", () => {
    expect(matchCategory("Farmácia")).toBe("saúde");
  });
});

describe("matchCategory — edge cases", () => {
  it("string vazia → outros (expense)", () => {
    expect(matchCategory("", "expense")).toBe("outros");
  });
  it("string vazia → renda (income)", () => {
    expect(matchCategory("", "income")).toBe("renda");
  });
  it("só espaços → outros", () => {
    expect(matchCategory("   ", "expense")).toBe("outros");
  });
});

describe("resolveAICategory — label canônico passado direto", () => {
  it.each([
    ["alimentação", "pizza", "alimentação"],
    ["transporte", "uber", "transporte"],
    ["saúde", "remédio", "saúde"],
    ["mercado", "compras", "mercado"],
    ["lazer", "netflix", "lazer"],
    ["renda", "salário", "renda"],
  ])('AI retorna "%s" → "%s"', (aiCategory, desc, expected) => {
    expect(resolveAICategory(aiCategory, desc)).toBe(expected);
  });
});

describe("resolveAICategory — aliases vindos da IA", () => {
  it.each([
    ["comida", "pizza", "alimentação"],
    ["food", "ifood", "alimentação"],
    ["alimentacao", "restaurante", "alimentação"],
    ["mobilidade", "uber", "transporte"],
    ["saude", "remedio", "saúde"],
    ["farmacia", "drogasil", "saúde"],
    ["casa", "aluguel", "moradia"],
    ["banco", "taxa", "finanças"],
    ["financas", "parcela", "finanças"],
    ["receita", "salario", "renda"],
    ["entrada", "pix recebido", "renda"],
    ["ganho", "freelance", "renda"],
  ])('AI retorna alias "%s" → canônico "%s"', (aiCategory, desc, expected) => {
    expect(resolveAICategory(aiCategory, desc)).toBe(expected);
  });
});

describe("resolveAICategory — categoria desconhecida faz fallback pela descrição", () => {
  it("retorna 'unknown_stuff' mas descrição é uber → transporte", () => {
    expect(resolveAICategory("unknown_stuff", "uber")).toBe("transporte");
  });
  it("retorna 'misc' mas descrição é netflix → lazer", () => {
    expect(resolveAICategory("misc", "netflix")).toBe("lazer");
  });
  it("retorna 'geral' e descrição aleatória → outros", () => {
    expect(resolveAICategory("geral", "coisa estranha xyz")).toBe("outros");
  });
});

describe("resolveAICategory — income força renda quando ambíguo", () => {
  it("AI retorna categoria desconhecida + income → renda", () => {
    expect(resolveAICategory("xyz", "", "income")).toBe("renda");
  });
});
