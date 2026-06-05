import { EmbedFactory } from "../EmbedFactory";
import { type Attachment, type ChatInputCommandInteraction, MessageFlags, type SlashCommandAttachmentOption, SlashCommandBuilder } from "discord.js";
import { request } from "undici";
import { getRoom } from "../../room/RoomManager";
import { ChatSounds, ChatStyle, Colors as HaxballColors } from "haxball-extended-room";

export const data = new SlashCommandBuilder()
  .setName("mapa")
  .setDescription("Carrega um novo mapa.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala.").setRequired(true))
  .addAttachmentOption((option: SlashCommandAttachmentOption) =>
    option
      .setName("arquivo")
      .setDescription("Arquivo do mapa (.hbs ou .json) para carregar.")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };

  if (!room) {
    await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral });
    return;
  }

  const arquivo: Attachment = interaction.options.getAttachment("arquivo", true);
  const extensao = arquivo.name.split(".").pop()?.toLowerCase();
  if (!isValidExtension(extensao)) {
    await interaction.reply({
      embeds: [EmbedFactory.createErrorEmbed("❌ Somente arquivos `.hbs` ou `.json` são permitidos.", user)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (room.isGameInProgress()) {
    await interaction.reply({
      embeds: [EmbedFactory.createErrorEmbed("❌ Não é possível alterar o mapa enquanto o jogo estiver em andamento.", user)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const stadiumData = await fetchStadiumData(arquivo.url);
    room.setStadium(stadiumData as any);
    room.send({
      message: `[DISCORD] ⚽ O mapa foi alterado para "${arquivo.name}" por ${interaction.user.username}.`,
      color: HaxballColors.Gold,
      style: ChatStyle.SmallBold,
      sound: ChatSounds.Normal,
    });

    await interaction.reply({
      embeds: [EmbedFactory.createSuccessEmbed(`✅ O mapa foi alterado com sucesso para \`${arquivo.name}\`.`, user)],
    });
  } catch {
    await interaction.reply({
      embeds: [EmbedFactory.createErrorEmbed("❌ Houve um erro ao processar o arquivo do mapa.", user)],
      flags: MessageFlags.Ephemeral,
    });
  }
}

function isValidExtension(extensao: string | undefined): boolean {
  return extensao === "hbs" || extensao === "json";
}

async function fetchStadiumData(url: string): Promise<object | string> {
  const { body } = await request(url);
  const buffer = Buffer.from(await body.arrayBuffer());
  const text = buffer.toString("utf8");

  try {
    return JSON.parse(text) as object;
  } catch {
    return text;
  }
}
