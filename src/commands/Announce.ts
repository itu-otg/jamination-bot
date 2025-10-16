import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, EmbedBuilder, TextChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'duyuru',
	description: 'Ayarlanmış bildirim kanalına bildirim gönderir. (Sadece moderasyon ekibi kullanabilir)',
	preconditions: ['GuildOnly', 'JamManagerOnly']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((b) => b.setName('content').setDescription('Bildirim içeriği').setRequired(true))
				.addBooleanOption((b) => b.setName('embed').setDescription('Embed olarak gönder'))
				.addBooleanOption((b) => b.setName('mention-everyone').setDescription('Herkesi etiketle'))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		let content = interaction.options.getString('message');
		const useEmbed = interaction.options.getBoolean('embed') ?? false;
		const mentionEveryone = interaction.options.getBoolean('mention-everyone') ?? false;

		if (mentionEveryone) {
			content = `${content}

      <@${interaction.guildId}>
      `;
		}

		const guildSettings = await this.container.db.guildSettings.findFirst({
			where: { guildID: interaction.guildId! }
		});

		if (!guildSettings || !guildSettings.notificationChannelID) {
			return interaction.reply({ content: 'Bildirim kanalı ayarlanmamış.', ephemeral: true });
		}

		const channel = await interaction.guild?.channels.fetch(guildSettings.notificationChannelID);

		if (!channel || channel.type !== ChannelType.GuildText) {
			return interaction.reply({ content: 'Bildirim kanalı ayarlanmamış yada kayıp.', ephemeral: true });
		}

		const textChannel = channel as TextChannel;

		try {
			if (useEmbed) {
				const embed = new EmbedBuilder()
					.setTitle('📢 Announcement')
					.setDescription(content)
					.setColor(0x7f91bd)
					.setFooter({ text: 'Jamination Bot', iconURL: interaction.client.user?.displayAvatarURL() })
					.setTimestamp();

				await textChannel.send({ embeds: [embed] });
			} else {
				await textChannel.send({ content: content! });
			}

			return interaction.reply({ content: 'Announcement sent!', ephemeral: true });
		} catch (error) {
			console.error(error);
			return interaction.reply({ content: 'Failed to send the announcement.', ephemeral: true });
		}
	}
}
