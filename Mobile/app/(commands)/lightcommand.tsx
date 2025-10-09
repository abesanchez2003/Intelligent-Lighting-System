import { db } from '../(component)/api/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function sendLightingCommand(command: {
	command: string;
	topic: string;
	value: number | string;
	target: 'mcu' | 'pi';
}) {
	try {
		await addDoc(collection(db, 'commands'), {
			command: command.command,
			topic: command.topic,
			value: command.value,
			target: command.target,
			timestamp: serverTimestamp(),
			status: 'pending',
		});
	} catch (error) {
		console.error('Error sending command: ', error);
	}
}
