const { Conversation, ConversationParticipant } = require('./models');

async function fixConversation() {
    try {
        console.log('Checking conversation 6...');

        const conv = await Conversation.findByPk(6, {
            include: [{
                model: ConversationParticipant,
                as: 'participants'
            }]
        });

        if (!conv) {
            console.log('Conversation 6 not found');
            return;
        }

        console.log('Conversation 6:', conv.toJSON());
        console.log('Participants:', conv.participants.length);

        conv.participants.forEach(p => {
            console.log('  - User', p.userId, 'leftAt:', p.leftAt);
        });

        // Option 1: Delete if broken
        if (conv.participants.length < 2) {
            console.log('Deleting broken conversation...');
            await ConversationParticipant.destroy({ where: { conversationId: 6 } });
            await Conversation.destroy({ where: { id: 6 } });
            console.log('✅ Deleted conversation 6');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

fixConversation();
