import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	name: 'üye-ekle',
	description: 'Takımınıza üye eklemek için bu komutu kullanın',
	preconditions: ['TeamLeadOnly', 'GuildOnly']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((opt) => opt.setName('member').setDescription('Takım arkadaşınızı girin').setRequired(true))
				.addStringOption((opt) => opt.setName('role').setDescription('Takım arkadaşınızın rolünü girin').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const member = interaction.options.getUser('member', true);
		const role = interaction.options.getString('role', true);

		// Find the team where the command user is the leader
		const team = await this.container.db.jamTeam.findFirst({
			where: {
				members: {
					some: {
						userID: interaction.user.id,
						isTeamLeader: true
					}
				}
			}
		});

		if (!team) {
			return interaction.reply({ content: 'Takım bulunamadı veya siz lider değilsiniz!', ephemeral: true });
		}

		// Check if the member is already in the team
		const existingMember = await this.container.db.jamTeamMember.findFirst({
			where: {
				userID: member.id,
				teamID: team.id
			}
		});

		if (existingMember) {
			return interaction.reply({ content: 'Bu kullanıcı zaten takımda!', ephemeral: true });
		}

		// Add the new member
		await this.container.db.jamTeamMember.create({
			data: {
				userID: member.id,
				teamID: team.id,
				role,
				isTeamLeader: false
			}
		});

		return interaction.reply({ content: `Başarıyla <@${member.id}> takımınıza eklendi!` });
	}
}
