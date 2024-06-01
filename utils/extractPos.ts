import { Pos } from "obsidian";

export function extractPos(text: string, pos: Pos) {
	return text.slice(pos.start.offset, pos.end.offset);
}
