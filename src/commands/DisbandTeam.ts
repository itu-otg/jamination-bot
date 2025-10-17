import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'takım-sil',
	description: 'Takımı yanlışlıkla mı oluşturdun? Hiç sorun değil. Bu komut ile silebilirsin!',
	preconditions: ['TeamLeadOnly', 'GuildOnly']
})
export class UserCommand extends Command {
	#successEmbed = new EmbedBuilder()
		.setTitle('Takım başarıyla silindi!')
		.setDescription('Artık başka bir takıma katılabilir ya da arkadaşınız sizi takımına ekleyebilir!')
		.setColor(0x7f91bd)
		.setTimestamp()
		.setFooter({ text: 'Jamination Bot', iconURL: this.container.client.user?.displayAvatarURL() ?? undefined });

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Defer reply (ephemeral if you want)
		await interaction.deferReply({ ephemeral: true });

		const teamToDelete = await this.container.db.jamTeam.findFirst({
			where: { members: { some: { userID: interaction.user.id } } }
		});

		if (!teamToDelete) {
			return interaction.editReply({
				content: 'Takım bulunamadı. Moderatör desteği isteyin.'
			});
		}

		const category = await interaction.guild?.channels.fetch(teamToDelete.categoryID);
		const role = await interaction.guild?.roles.fetch(teamToDelete.discordRoleID);

		if (!category || category.type !== ChannelType.GuildCategory) {
			return interaction.editReply({
				content: 'Ekip kategorisi bulunamadı veya geçersiz.'
			});
		}

		if (!role) {
			return interaction.editReply({
				content: 'Ekip rolü bulunamadı veya geçersiz.'
			});
		}

		const children = category.children.cache;
		for (const [, child] of children) {
			await child.delete().catch(this.container.logger.error);
		}

		await category.delete().catch(this.container.logger.error);
    await role.delete().catch(this.container.logger.error)

		await this.container.db.jamTeam.delete({
			where: {
				id: teamToDelete.id
			}
		});

		return interaction.editReply({ embeds: [this.#successEmbed] });
	}
}
