import { db } from '../(component)/api/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { publishCommand } from './mqttclient';

export async function sendLightingCommand(command: {
	topic: string;
	value: number | string;
}) {
	try {

	await publishCommand(command.topic, command.value);

	} catch (error) {
		console.error('Error sending command: ', error);
	}
}
