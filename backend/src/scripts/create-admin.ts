import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcrypt";
import { sequelize } from "../database/sequelize.js";
import { Role, User } from "../database/models.js";

// Este comando es deliberadamente local: el primer administrador no se crea
// mediante una ruta HTTP pública ni con credenciales conocidas en un seeder.
const askHidden = async (rl: readline.Interface, question: string): Promise<string> => {
  const terminal = process.stdin;
  if (!terminal.isTTY || typeof terminal.setRawMode !== "function") return rl.question(`${question} `);

  output.write(question);
  terminal.setRawMode(true);
  let answer = "";
  return new Promise<string>((resolve) => {
    const onData = (chunk: Buffer): void => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") process.exit(130);
      if (key === "\r" || key === "\n") {
        terminal.setRawMode(false);
        terminal.off("data", onData);
        output.write("\n");
        resolve(answer);
      } else if (key === "\u007f") {
        answer = answer.slice(0, -1);
      } else {
        answer += key;
      }
    };
    terminal.on("data", onData);
  });
};

const main = async (): Promise<void> => {
  const rl = readline.createInterface({ input, output });
  try {
    const email = (await rl.question("Email del administrador: ")).trim().toLowerCase();
    const password = await askHidden(rl, "Contraseña (mínimo 12 caracteres): ");
    const confirmation = await askHidden(rl, "Repetir contraseña: ");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El email no es válido");
    if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres");
    if (password !== confirmation) throw new Error("Las contraseñas no coinciden");

    await sequelize.authenticate();
    const [role] = await Role.findOrCreate({ where: { name: "admin" }, defaults: { description: "Administrador del sistema" } });
    const existingUser = await User.findOne({ where: { email }, paranoid: false });
    if (existingUser) throw new Error("Ya existe un usuario con ese email");

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, passwordHash, roleId: role.id, isActive: true });
    console.log("Administrador creado correctamente.");
  } finally {
    rl.close();
    await sequelize.close();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se pudo crear el administrador");
  process.exitCode = 1;
});
