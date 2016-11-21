import {
  Type, Component, Output, EventEmitter, Input, HostBinding,
  ViewChild, ElementRef, Renderer, ChangeDetectionStrategy, Optional
} from '@angular/core';
import { translateXY, columnsByPin, columnGroupWidths, RowHeightCache } from '../../utils';
import { SelectionType } from '../../types';
import { ScrollerComponent } from './scroller.component';
import { ContextMenuItemDescriptor } from '../../models';
import { DataTableContextMenuConfig } from '../../services';

import { ContextMenuComponent } from '../context-menu.component';

@Component({
  selector: 'datatable-body',
  template: `
    <datatable-selection 
      #selector
      [selected]="selected"
      [rows]="rows"
      [selectCheck]="selectCheck"
      [selectEnabled]="selectEnabled"
      [selectionType]="selectionType"
      [rowIdentity]="rowIdentity"
      (select)="select.emit($event)"
      (activate)="activate.emit($event)">

      <datatable-progress
        *ngIf="loadingIndicator">
      </datatable-progress>

      <datatable-scroller
        *ngIf="rows.length"
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [scrollHeight]="scrollHeight"
        [scrollWidth]="columnGroupWidths.total"
        (scroll)="onBodyScroll($event)">
        <datatable-row-wrapper 
          *ngFor="let row of temp; let i = index; trackBy: row?.$$index"
          [ngStyle]="getRowsStyles(row)"
          [rowDetailTemplate]="rowDetailTemplate"
          [detailRowHeight]="detailRowHeight"
          [row]="row"
          [expanded]="row.$$expanded === 1"
          [contextMenu]="dataTableCtxtMenu"
          [contextMenuSubject]="row">
          <datatable-body-row
            tabindex="-1"
            [isSelected]="selector.getRowSelected(row)"
            [innerWidth]="innerWidth"
            [offsetX]="offsetX"
            [columns]="columns"
            [rowHeight]="rowHeight"
            [row]="row"
            (activate)="selector.onActivate($event, i)">
          </datatable-body-row>
        </datatable-row-wrapper>
      </datatable-scroller>

      <div *ngIf="useContextMenu">
        <context-menu>
          <div *ngFor="let menuDesc of menuDescriptors; let j = index; trackBy: menuDesc?.order">
            <template 
              contextMenuItem
              [menuItemDetailTemplate]="menuItemDetailTemplate"
              [menuDescriptor]="menuDesc"
              [visible]="contextMenuVisible"
              [enabled]="contextMenuEnabled"
              (execute)="onContextMenuExecuted($event.item, menuDesc)">
            </template>
          </div>          
        </context-menu>
      </div>

      <div
        class="empty-row"
        *ngIf="!rows.length"
        [innerHTML]="emptyMessage">
      </div>
      
    </datatable-selection>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableBodyComponent {
  /** True to turn on context menu feature. */
  @Input() useContextMenu: boolean = false;

  /** Reference to the data table context menu child component. This is defined so that [datatable-row-wrapper] can locate the correct ContextMenuComponent. */
  @ViewChild(ContextMenuComponent) public dataTableCtxtMenu: ContextMenuComponent;

  /** 
   * A function to determine if a menu item for a specific data item (e.g. data row) should be visible. 
   * {dataItem}: represents the data item row.
   * {ctxtMenuDef}: represents the context menu item (e.g: for example 'View' or 'Edit')
   * Note that the combination of both the data item row and the menu item can be used to determine if the menu item should be visible.
   * For example: if an offer (data item) is already cancelled, then the 'Cancel' menu item may not be visible.
  */ 
  @Input() public contextMenuVisible: boolean | ((dataItem: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean);

  /** 
   * A function to determine if a menu item for a specific data item (e.g. data row) should be enabled. 
   * {dataItem}: represents the data item row.
   * {ctxtMenuDef}: represents the context menu item (e.g: for example 'View' or 'Edit')
   * Note that the combination of both the data item row and the menu item can be used to determine if the menu item should be enabled.
   * For example: if an offer (data item) is already cancelled, then the 'Cancel' menu item may not be enabled.
  */
  @Input() public contextMenuEnabled: boolean | ((dataItem: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean);

  /** Menu Item Detail template reference. */
  @Input() menuItemDetailTemplate: any;

  /** Reference to the scroller child component. */
  @ViewChild(ScrollerComponent) scroller: ScrollerComponent;

  @Input() scrollbarV: boolean;
  @Input() scrollbarH: boolean;
  @Input() loadingIndicator: boolean;
  @Input() rowHeight: number;
  @Input() offsetX: number;
  @Input() detailRowHeight: any;
  @Input() emptyMessage: string;
  @Input() selectionType: SelectionType;
  @Input() selected: any[];
  @Input() rowIdentity: any;
  @Input() rowDetailTemplate: any;
  @Input() selectCheck: any;

  @Input() set pageSize(val: number) {
    this._pageSize = val;
    this.recalcLayout();
  }

  get pageSize(): number {
    return this._pageSize;
  }

  @Input() set rows(val: any[]) {
    this._rows = val;
    this.recalcLayout();
  }

  get rows(): any[] {
    return this._rows;
  }

  @Input() set columns(val: any[]) {
    this._columns = val;

    const colsByPin = columnsByPin(val);
    this.columnGroupWidths = columnGroupWidths(colsByPin, val);
  }

  get columns(): any[] {
    return this._columns;
  }

  @Input() set offset(val: number) {
    this._offset = val;
    this.recalcLayout();
  }

  get offset(): number {
    return this._offset;
  }

  @Input() set rowCount(val: number) {
    this._rowCount = val;
    this.recalcLayout();
  }

  get rowCount(): number {
    return this._rowCount;
  }

  /** List of context menu descriptors (e.g. for example: View, Edit, Delete). */
  get menuDescriptors(): Array<ContextMenuItemDescriptor> {
    return this._ctxtMenuConfig.menuDescriptors;
  }

  @Input() innerWidth: number;

  @HostBinding('style.width')
  get bodyWidth(): string {
    if (this.scrollbarH) {
      return this.innerWidth + 'px';
    } else {
      return '100%';
    }
  }

  @Input()
  @HostBinding('style.height')
  set bodyHeight(val) {
    if (this.scrollbarV) {
      this._bodyHeight = val + 'px';
    } else {
      this._bodyHeight = 'auto';
    }

    this.recalcLayout();
  }

  get bodyHeight() {
    return this._bodyHeight;
  }

  @Output() scroll: EventEmitter<any> = new EventEmitter();
  @Output() page: EventEmitter<any> = new EventEmitter();
  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() detailToggle: EventEmitter<any> = new EventEmitter();

  /** Propagates the event when a menu item is selected. */
  @Output() contextMenuExecuted: EventEmitter<any> = new EventEmitter();

  get selectEnabled(): boolean {
    return !!this.selectionType;
  }

  private rowHeightsCache: RowHeightCache = new RowHeightCache();
  private temp: any[] = [];
  private offsetY: number = 0;
  private indexes: any = {};
  private columnGroupWidths: any;

  private _rows: any[];
  private _bodyHeight: any;
  private _columns: any[];
  private _rowCount: number;
  private _offset: number;
  private _pageSize: number;

  /**
   * Property that would calculate the height of scroll bar
   * based on the row heights cache for virtual scroll. Other scenarios
   * calculate scroll height automatically (as height will be undefined).
   */
  get scrollHeight(): number {
    if (this.scrollbarV) {
      return this.rowHeightsCache.query(this.rowCount - 1);
    }
  }

  constructor(element: ElementRef, renderer: Renderer, @Optional() private _ctxtMenuConfig: DataTableContextMenuConfig) {
    renderer.setElementClass(element.nativeElement, 'datatable-body', true);
  }

  updateOffsetY(offset?: number): void {
    if (this.scrollbarV && offset) {
      // First get the row Index that we need to move to.
      const rowIndex = this.pageSize * offset;
      offset = this.rowHeightsCache.query(rowIndex - 1);
    }

    this.scroller.setOffset(offset || 0);
  }

  onBodyScroll({ scrollYPos, scrollXPos, direction }): void {
    // if scroll change, trigger update
    // this is mainly used for header cell positions
    if (this.offsetY !== scrollYPos || this.offsetX !== scrollXPos) {
      this.scroll.emit({
        offsetY: scrollYPos,
        offsetX: scrollXPos
      });
    }

    this.offsetY = scrollYPos;
    this.offsetX = scrollXPos;

    this.updateIndexes();
    this.updatePage(direction);
    this.updateRows();
  }

  updatePage(direction): void {
    let offset = this.indexes.first / this.pageSize;

    if (direction === 'up') {
      offset = Math.floor(offset);
    } else if (direction === 'down') {
      offset = Math.ceil(offset);
    }

    if (direction !== undefined && !isNaN(offset)) {
      this.page.emit({ offset });
    }
  }

  updateRows(): void {
    const { first, last } = this.indexes;
    let rowIndex = first;
    let idx = 0;
    let temp = [];

    while (rowIndex < last && rowIndex < this.rowCount) {
      let row = this.rows[rowIndex];

      if (row) {
        row.$$index = rowIndex;
        temp[idx] = row;
      }

      idx++;
      rowIndex++;
    }

    this.temp = temp;
  }

  /**
   * Calculate row height based on the expanded state of the row.
   *
   * @param row  the row for which the height need to be calculated.
   * @returns {number}  height of the row.
   */
  getRowHeight(row: any): number {
    // Adding detail row height if its expanded.
    return this.rowHeight +
      (row.$$expanded === 1 ? this.detailRowHeight : 0);
  }

  /**
   * Calculates the styles for the row so that the rows can be moved in 2D space
   * during virtual scroll inside the DOM.   In the below case the Y position is
   * manipulated.   As an example, if the height of row 0 is 30 px and row 1 is
   * 100 px then following styles are generated:
   *
   * transform: translate3d(0px, 0px, 0px);    ->  row0
   * transform: translate3d(0px, 30px, 0px);   ->  row1
   * transform: translate3d(0px, 130px, 0px);  ->  row2
   *
   * Row heights have to be calculated based on the row heights cache as we wont
   * be able to determine which row is of what height before hand.  In the above
   * case the positionY of the translate3d for row2 would be the sum of all the
   * heights of the rows before it (i.e. row0 and row1).
   *
   * @param row The row that needs to be placed in the 2D space.
   * @returns {{styles: string}}  Returns the CSS3 style to be applied
   */
  getRowsStyles(row): any {
    const rowHeight = this.getRowHeight(row);

    let styles = {
      height: rowHeight + 'px'
    };

    if (this.scrollbarV) {
      const idx = row ? row.$$index : 0;

      // const pos = idx * rowHeight;
      // The position of this row would be the sum of all row heights
      // until the previous row position.
      const pos = this.rowHeightsCache.query(idx - 1);

      translateXY(styles, 0, pos);
    }

    return styles;
  }

  hideIndicator(): void {
    setTimeout(() => this.loadingIndicator = false, 500);
  }

  updateIndexes(): void {
    let first = 0;
    let last = 0;

    if (this.scrollbarV) {
      // Calculation of the first and last indexes will be based on where the
      // scrollY position would be at.  The last index would be the one
      // that shows up inside the view port the last.
      const height = parseInt(this.bodyHeight, 0);
      first = this.rowHeightsCache.getRowIndex(this.offsetY);
      last = this.rowHeightsCache.getRowIndex(height + this.offsetY) + 1;
    } else {
      first = Math.max(this.offset * this.pageSize, 0);
      last = Math.min((first + this.pageSize), this.rowCount);
    }

    this.indexes = { first, last };
  }

  /**
   *  Refreshes the full Row Height cache.  Should be used
   *  when the entire row array state has changed.
   */
  refreshRowHeightCache(): void {
    if (!this.scrollbarV) return;

    // clear the previous row height cache if already present.
    // this is useful during sorts, filters where the state of the
    // rows array is changed.
    this.rowHeightsCache.clearCache();

    // Initialize the tree only if there are rows inside the tree.
    if (this.rows && this.rows.length) {
      this.rowHeightsCache.initCache(
        this.rows, this.rowHeight, this.detailRowHeight);
    }
  }

  getAdjustedViewPortIndex(): number {
    // Capture the row index of the first row that is visible on the viewport.
    // If the scroll bar is just below the row which is highlighted then make that as the
    // first index.
    let viewPortFirstRowIndex = this.indexes.first;

    if (this.scrollbarV) {
      const offsetScroll = this.rowHeightsCache.query(viewPortFirstRowIndex - 1);
      return offsetScroll <= this.offsetY ? viewPortFirstRowIndex - 1 : viewPortFirstRowIndex;
    }

    return viewPortFirstRowIndex;
  }

  /**
   * Toggle the Expansion of the row i.e. if the row is expanded then it will
   * collapse and vice versa.   Note that the expanded status is stored as
   * a part of the row object itself as we have to preserve the expanded row
   * status in case of sorting and filtering of the row set.
   *
   * @param row The row for which the expansion needs to be toggled.
   */
  toggleRowExpansion(row: any): void {
    // Capture the row index of the first row that is visible on the viewport.
    let viewPortFirstRowIndex = this.getAdjustedViewPortIndex();

    // If the detailRowHeight is auto --> only in case of non-virtualized scroll
    if (this.scrollbarV) {
      const detailRowHeight = this.detailRowHeight * (row.$$expanded ? -1 : 1);
      this.rowHeightsCache.update(row.$$index, detailRowHeight);
    }

    // Update the toggled row and update the heights in the cache.
    row.$$expanded ^= 1;

    this.detailToggle.emit({
      rows: [row],
      currentIndex: viewPortFirstRowIndex
    });
  }

  /**
   * Expand/Collapse all the rows no matter what their state is.
   * @param expanded When true, all rows are expanded and when false, all rows will be collapsed.
   */
  toggleAllRows(expanded: boolean): void {
    let rowExpanded = expanded ? 1 : 0;

    // Capture the row index of the first row that is visible on the viewport.
    let viewPortFirstRowIndex = this.getAdjustedViewPortIndex();

    for (let row of this.rows) {
      row.$$expanded = rowExpanded;
    }

    if (this.scrollbarV) {
      // Refresh the full row heights cache since every row was affected.
      this.refreshRowHeightCache();
    }

    // Emit all rows that have been expanded.
    this.detailToggle.emit({
      rows: this.rows,
      currentIndex: viewPortFirstRowIndex
    });
  }

  recalcLayout(): void {
    this.refreshRowHeightCache();
    this.updateIndexes();
    this.updateRows();
  }

  /** Propagates event when a menu item is selected. */
  onContextMenuExecuted(dataItem: any, ctxtMenuDef: any): void {
    this.contextMenuExecuted.emit({ dataItem: dataItem, ctxtMenuDef: ctxtMenuDef });
  }
}
