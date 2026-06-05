import { EmbedBuilder, Colors, type ColorResolvable } from "discord.js";

let botName = "Bot";
let botURL = "";
const currentYear = new Date().getFullYear();

export function getBotName(): string {
  return botName;
}
export function getBotURL(): string {
  return botURL;
}
export function updateBotInfo(name: string, url: string): void {
  botName = name;
  botURL = url;
}

export class EmbedFactory {
  private static safeURL(url: string | undefined): string | undefined {
    return url && url.startsWith("http") ? url : undefined;
  }

  static createErrorEmbed(description: string, requester: { name: string; avatarURL: string }): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(description)
      .setAuthor({ name: `Solicitado por ${requester.name}`, iconURL: this.safeURL(requester.avatarURL) })
      .setFooter({ text: `${currentYear} © ${botName} - Todos os direitos reservados`, iconURL: this.safeURL(botURL) });
  }

  static createSuccessEmbed(description: string, requester: { name: string; avatarURL: string }): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(description)
      .setAuthor({ name: `Solicitado por ${requester.name}`, iconURL: this.safeURL(requester.avatarURL) })
      .setFooter({ text: `${currentYear} © ${botName} - Todos os direitos reservados`, iconURL: this.safeURL(botURL) });
  }

  static createCustomEmbed(description: string, requester: { name: string; avatarURL: string }, color: ColorResolvable): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setAuthor({ name: `Solicitado por ${requester.name}`, iconURL: this.safeURL(requester.avatarURL) })
      .setFooter({ text: `${currentYear} © ${botName} - Todos os direitos reservados`, iconURL: this.safeURL(botURL) });
  }

  static createTitledEmbed(title: string, description: string, requester: { name: string; avatarURL: string }, color: ColorResolvable): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(description)
      .setAuthor({ name: `Solicitado por ${requester.name}`, iconURL: this.safeURL(requester.avatarURL) })
      .setFooter({ text: `${currentYear} © ${botName} - Todos os direitos reservados`, iconURL: this.safeURL(botURL) });
  }
}
