/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as editorCommon from 'vs/editor/common/editorCommon';
import { Position } from 'vs/editor/common/core/position';
import { ICoordinatesConverter } from 'vs/editor/common/viewModel/viewModel';
import { Selection } from 'vs/editor/common/core/selection';
import * as viewEvents from 'vs/editor/common/view/viewEvents';

export interface ICursorPositionChangedEvent {
	readonly position: Position;
	readonly viewPosition: Position;
	readonly secondaryPositions: Position[];
	readonly secondaryViewPositions: Position[];
	readonly isInEditableRange: boolean;
}

export interface ICursorSelectionChangedEvent {
	readonly selection: Selection;
	readonly viewSelection: Selection;
	readonly secondarySelections: Selection[];
	readonly secondaryViewSelections: Selection[];
}

export class ViewModelCursors {

	private readonly configuration: editorCommon.IConfiguration;
	private readonly coordinatesConverter: ICoordinatesConverter;

	private lastCursorPositionChangedEvent: ICursorPositionChangedEvent;
	private lastCursorSelectionChangedEvent: ICursorSelectionChangedEvent;

	constructor(configuration: editorCommon.IConfiguration, coordinatesConverter: ICoordinatesConverter) {
		this.configuration = configuration;
		this.coordinatesConverter = coordinatesConverter;
		this.lastCursorPositionChangedEvent = null;
		this.lastCursorSelectionChangedEvent = null;
	}

	/**
	 * Limit position to be somewhere where it can actually be rendered
	 */
	private static _toPositionThatCanBeRendered(position: Position, stopRenderingLineAfter: number) {
		// Limit position to be somewhere where it can actually be rendered
		if (stopRenderingLineAfter !== -1 && position.column > stopRenderingLineAfter) {
			position = new Position(position.lineNumber, stopRenderingLineAfter);
		}
		return position;
	}

	public onCursorPositionChanged(e: ICursorPositionChangedEvent, emit: (eventType: string, payload: any) => void): void {
		this.lastCursorPositionChangedEvent = e;

		const stopRenderingLineAfter = this.configuration.editor.viewInfo.stopRenderingLineAfter;

		let position = ViewModelCursors._toPositionThatCanBeRendered(e.viewPosition, stopRenderingLineAfter);
		let secondaryPositions: Position[] = [];
		for (let i = 0, len = e.secondaryPositions.length; i < len; i++) {
			secondaryPositions[i] = ViewModelCursors._toPositionThatCanBeRendered(e.secondaryViewPositions[i], stopRenderingLineAfter);
		}

		let newEvent: viewEvents.IViewCursorPositionChangedEvent = {
			_viewCursorPositionChangedEventBrand: void 0,
			position: position,
			secondaryPositions: secondaryPositions,
			isInEditableRange: e.isInEditableRange
		};
		emit(viewEvents.ViewEventNames.CursorPositionChangedEvent, newEvent);
	}

	public onCursorSelectionChanged(e: ICursorSelectionChangedEvent, emit: (eventType: string, payload: any) => void): void {
		this.lastCursorSelectionChangedEvent = e;

		let newEvent: viewEvents.IViewCursorSelectionChangedEvent = {
			_viewCursorSelectionChangedEventBrand: void 0,
			selection: e.viewSelection,
			secondarySelections: e.secondaryViewSelections
		};
		emit(viewEvents.ViewEventNames.CursorSelectionChangedEvent, newEvent);
	}

	public onCursorRevealRange(e: editorCommon.ICursorRevealRangeEvent, emit: (eventType: string, payload: any) => void): void {
		let newEvent: viewEvents.IViewRevealRangeEvent = {
			_viewRevealRangeEventBrand: void 0,
			range: e.viewRange,
			verticalType: e.verticalType,
			revealHorizontal: e.revealHorizontal,
			revealCursor: e.revealCursor
		};
		emit(viewEvents.ViewEventNames.RevealRangeEvent, newEvent);
	}

	public onCursorScrollRequest(e: editorCommon.ICursorScrollRequestEvent, emit: (eventType: string, payload: any) => void): void {
		let newEvent: viewEvents.IViewScrollRequestEvent = {
			_viewScrollRequestEventBrand: void 0,
			deltaLines: e.deltaLines,
			revealCursor: e.revealCursor
		};
		emit(viewEvents.ViewEventNames.ScrollRequestEvent, newEvent);
	}

	public onLineMappingChanged(emit: (eventType: string, payload: any) => void): void {
		if (this.lastCursorPositionChangedEvent) {
			const toViewPos = (pos: Position) => this.coordinatesConverter.convertModelPositionToViewPosition(pos);
			let e: ICursorPositionChangedEvent = {
				position: this.lastCursorPositionChangedEvent.position,
				viewPosition: toViewPos(this.lastCursorPositionChangedEvent.position),
				secondaryPositions: this.lastCursorPositionChangedEvent.secondaryPositions,
				secondaryViewPositions: this.lastCursorPositionChangedEvent.secondaryPositions.map(toViewPos),
				isInEditableRange: this.lastCursorPositionChangedEvent.isInEditableRange,
			};
			this.onCursorPositionChanged(e, emit);
		}

		if (this.lastCursorSelectionChangedEvent) {
			const toViewSel = (sel: Selection) => this.coordinatesConverter.convertModelSelectionToViewSelection(sel);
			let e: ICursorSelectionChangedEvent = {
				selection: this.lastCursorSelectionChangedEvent.selection,
				viewSelection: toViewSel(this.lastCursorSelectionChangedEvent.selection),
				secondarySelections: this.lastCursorSelectionChangedEvent.secondarySelections,
				secondaryViewSelections: this.lastCursorSelectionChangedEvent.secondarySelections.map(toViewSel),
			};
			this.onCursorSelectionChanged(e, emit);
		}
	}
}
