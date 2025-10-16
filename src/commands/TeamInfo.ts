import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'takım-bilgisi',
	description: 'Takımınız hakkında bilgi alın!',
	preconditions: ['GuildOnly', 'TeamMemberOnly']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// Find the team of the user
		const team = await this.container.db.jamTeam.findFirst({
			where: {
				members: {
					some: { userID: interaction.user.id }
				}
			},
			include: {
				members: true // Include team members
			}
		});

		if (!team) {
			return interaction.reply({ content: 'Henüz bir takımda değilsiniz!', ephemeral: true });
		}

		// Fetch Discord objects
		const guild = interaction.guild!;
		const category = team.categoryID ? await guild.channels.fetch(team.categoryID) : null;
		const textChannel = team.textChannelID ? await guild.channels.fetch(team.textChannelID) : null;
		const voiceChannel = team.voiceChannelID ? await guild.channels.fetch(team.voiceChannelID) : null;
		const role = team.discordRoleID ? await guild.roles.fetch(team.discordRoleID) : null;

		const embed = new EmbedBuilder()
			.setTitle(`Takım Bilgisi: ${team.name}`)
			.setColor(0x7f91bd)
			.addFields(
				{ name: 'Kategori', value: category?.name || 'Bulunamadı', inline: true },
				{ name: 'Text Kanal', value: textChannel?.name || 'Bulunamadı', inline: true },
				{ name: 'Voice Kanal', value: voiceChannel?.name || 'Bulunamadı', inline: true },
				{ name: 'Rol', value: role?.name || 'Bulunamadı', inline: true },
				{ name: 'Üyeler', value: team.members.map((m) => `<@${m.userID}>`).join(', ') || 'Yok' }
			)
			.setFooter({ text: 'Jamination Bot', iconURL: this.container.client.user?.displayAvatarURL() ?? undefined });

		return interaction.reply({ embeds: [embed] });
	}
}
