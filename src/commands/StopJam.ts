import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	EmbedBuilder
} from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'jam-kapat',
	description: 'Sunucuda jam modunu devre dışı bırakır. (Sadece moderasyon ekibi kullanabilir.)',
	preconditions: ['GuildOnly']
})
export class JamDisableCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const modal = new ModalBuilder()
			.setCustomId('confirm-jam-disable')
			.setTitle('Jam Modunu Kapat');

		const confirmInput = new TextInputBuilder()
			.setCustomId('confirmation')
			.setLabel('Onaylamak için "KAPAT" yazın')
			.setPlaceholder('KAPAT')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const row = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput);
		modal.addComponents(row);

		await interaction.showModal(modal);

		try {
			const modalInteraction = await interaction.awaitModalSubmit({
				time: 60_000,
				filter: (i) => i.customId === 'confirm-jam-disable' && i.user.id === interaction.user.id
			});

			const confirmation = modalInteraction.fields.getTextInputValue('confirmation');
			if (confirmation !== 'KAPAT') {
				return await modalInteraction.reply({
					content: 'İşlem iptal edildi. Onaylamak için **KAPAT** yazmanız gerekiyor.',
					ephemeral: true
				});
			}

			const guildSettings = await this.container.db.guildSettings.findFirst({
				where: { guildID: interaction.guildId! }
			});

			if (!guildSettings || guildSettings.isActive === false) {
				return await modalInteraction.reply({
					content: 'Jam modu bu sunucuda etkin değil.',
					ephemeral: true
				});
			}

			await this.container.db.guildSettings.update({
				where: { guildID: interaction.guildId! },
				data: { isActive: false }
			});

			const jamTeamCount = await this.container.db.jamTeam.count({
				where: { guildID: interaction.guildId! }
			});
			const jamMemberCount = await this.container.db.jamTeamMember.count({
				where: {
					team: { guildID: interaction.guildId! }
				}
			});

			const embed = new EmbedBuilder()
				.setTitle('Jam Modu Kapatıldı')
				.setDescription('Jam modu başarıyla devre dışı bırakıldı.')
				.setColor(0xff6b6b)
				.addFields(
					{ name: 'Takım Sayısı', value: `${jamTeamCount}`, inline: true },
					{ name: 'Üye Sayısı', value: `${jamMemberCount}`, inline: true }
				)
				.setFooter({
					text: 'Jamination Bot',
					iconURL: interaction.client.user?.displayAvatarURL() || undefined
				})
				.setTimestamp();

			return await modalInteraction.reply({ embeds: [embed] });
		} catch (err) {
			this.container.logger.error(err);
			return await interaction.followUp({
				content: 'Onay süresi doldu veya bir hata oluştu.',
				ephemeral: true
			});
		}
	}
}

