import {
  Component, Input, Output, ElementRef, EventEmitter, ViewChild,
  HostListener, ContentChildren, OnInit, QueryList, AfterViewInit,
  HostBinding, Renderer, ContentChild, TemplateRef, ChangeDetectionStrategy
} from '@angular/core';

import { forceFillColumnWidths, adjustColumnWidths, sortRows } from '../utils';
import { ColumnMode, SortType, SelectionType } from '../types';
import { DataTableBodyComponent } from './body';
import { DataTableColumnDirective } from './column.directive';
import { DatatableRowDetailDirective } from './row-detail.directive';
import { MenuItemDetailDirective } from './menu-item-detail.directive';
import { scrollbarWidth, setColumnDefaults, translateTemplates } from '../utils';
import { ContextMenuItemDescriptor } from '../models'

@Component({
  selector: 'e3r-data-table',
  template: `
    <div
      visibility-observer
      (visible)="recalculate()">
      <datatable-header
        *ngIf="headerHeight"
        [sorts]="sorts"
        [sortType]="sortType"
        [scrollbarH]="scrollbarH"
        [innerWidth]="innerWidth"
        [offsetX]="offsetX"
        [columns]="columns"
        [headerHeight]="headerHeight"
        [sortAscendingIcon]="cssClasses.sortAscending"
        [sortDescendingIcon]="cssClasses.sortDescending"
        (sort)="onColumnSort($event)"
        (resize)="onColumnResize($event)"
        (reorder)="onColumnReorder($event)"
        (activate)="activate.emit($event)">
      </datatable-header>
      <datatable-body
        [rows]="rows"
        [scrollbarV]="scrollbarV"
        [scrollbarH]="scrollbarH"
        [loadingIndicator]="loadingIndicator"
        [rowHeight]="rowHeight"
        [rowCount]="rowCount"
        [offset]="offset"
        [columns]="columns"
        [pageSize]="pageSize"
        [offsetX]="offsetX"
        [rowDetailTemplate]="rowDetailTemplate"
        [menuItemDetailTemplate]="menuItemDetailTemplate"
        [detailRowHeight]="detailRowHeight"
        [selected]="selected"
        [innerWidth]="innerWidth"
        [bodyHeight]="bodyHeight"
        [selectionType]="selectionType"
        [emptyMessage]="messages.emptyMessage"
        [rowIdentity]="rowIdentity"
        [selectCheck]="selectCheck"
        (page)="onBodyPage($event)"
        (activate)="activate.emit($event)"
        (select)="select.emit($event)"
        (detailToggle)="detailToggle.emit($event)"
        (scroll)="onBodyScroll($event)"
        [useContextMenu]="useContextMenu"
        [contextMenuVisible]="contextMenuVisible"
        [contextMenuEnabled]="contextMenuEnabled"
        (contextMenuExecuted)="contextMenuExecuted.emit($event)">
      </datatable-body>
      <datatable-footer
        *ngIf="footerHeight"
        [rowCount]="rowCount"
        [pageSize]="pageSize"
        [offset]="offset"
        [footerHeight]="footerHeight"
        [totalMessage]="messages.totalMessage"
        (page)="onFooterPage($event)"
        (activate)="activate.emit($event)">
      </datatable-footer>            
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableComponent implements OnInit, AfterViewInit {

  // Rows
  @Input() set rows(val: any[]) {
    if (!this._fromonColumnSort && !this.externalSorting) {
      val = this.sortPageRows(val, this.sorts, this.offset, this.limit, this.columns);
    }

    if (this._fromonColumnSort) { this._fromonColumnSort = false; }

    this._rows = val;
    this.recalculate();
  }

  get rows(): any[] {
    return this._rows;
  }

  // Columns
  @Input() set columns(val: any[]) {
    if (val) {
      setColumnDefaults(val);
      this.recalculateColumns(val);
    }

    this._columns = val;
  }

  get columns(): any[] {
    return this._columns;
  }

  // Selected rows
  @Input() selected: any[];

  // Enable vertical scrollbars
  @Input() scrollbarV: boolean = false;

  // Enable horz scrollbars
  @Input() scrollbarH: boolean = false;

  // The row height; which is necessary
  // to calculate the height for the lazy rendering.
  @Input() rowHeight: number = 30;

  // The detail row height is required especially when virtual scroll is enabled.
  @Input() detailRowHeight: number = 0;

  // Type of column width distribution.
  // Example: flex, force, standard
  @Input() columnMode: ColumnMode = ColumnMode.standard;

  // The minimum header height in pixels.
  // pass falsey for no header
  // note: number|string does not work right
  @Input() headerHeight: any = 30;

  // The minimum footer height in pixels.
  // pass falsey for no footer
  @Input() footerHeight: number = 0;

  // if external paging is turned on
  @Input() externalPaging: boolean = false;

  // Page size
  @Input() limit: number = undefined;

  // Total count
  private _count: number = 0;
  @Input() set count(val: number) {
    this._count = val;
    this.recalculateDims();
  }

  get count(): number {
    return this._count;
  }

  // Page offset
  @Input() offset: number = 0;

  // Loading indicator
  @Input() loadingIndicator: boolean = false;

  // Selections?
  @Input() selectionType: SelectionType;

  // if you can reorder columns
  @Input() reorderable: boolean = true;

  // type of sorting
  @Input() sortType: SortType = SortType.single;

  // If sorting is performed on server or 'in-page' on client.
  @Input() externalSorting: boolean = false;

  // sorts
  @Input() sorts: any[] = [];

  // row detail template
  @Input() rowDetailTemplate: TemplateRef<any>;

  @Input() menuItemDetailTemplate: TemplateRef<any>;

  // css class overrides
  @Input() cssClasses: any = {
    sortAscending: 'icon-down',
    sortDescending: 'icon-up',
    pagerLeftArrow: 'icon-left',
    pagerRightArrow: 'icon-right',
    pagerPrevious: 'icon-prev',
    pagerNext: 'icon-skip'
  };

  // message overrides for localization
  @Input() messages: any = {

    // Message to show when array is presented
    // but contains no values
    emptyMessage: 'No data to display',

    // Footer total message
    totalMessage: 'total'

  };

  // This will be used when displaying or selecting rows:
  // when tracking/comparing them, we'll use the value of this fn,
  // (`fn(x) === fn(y)` instead of `x === y`)
  @Input() rowIdentity: any = ((x) => x);

  // A boolean/function you can use to check whether you want
  // to select a particular row based on a criteria. Example:
  // (selection) => { return selection !== 'Ethel Price'; }
  @Input() selectCheck: any;

  /** A boolean to set to TRUE if we want to enable contextual menu functionality. */
  @Input() useContextMenu: boolean = false;

  /** A function to determine if a menu item for a specific data item (e.g. data row) should be visible. */
  @Input() contextMenuVisible: boolean | ((dataItem: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean);

  /** A function to determine if a menu item for a specific data item (e.g. data row) should be enabled. */
  @Input() contextMenuEnabled: boolean | ((dataItem: any, ctxtMenuDef: ContextMenuItemDescriptor) => boolean);

  @Output() scroll: EventEmitter<any> = new EventEmitter();
  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() sort: EventEmitter<any> = new EventEmitter();
  @Output() page: EventEmitter<any> = new EventEmitter();
  @Output() detailToggle: EventEmitter<any> = new EventEmitter();
  @Output() reorder: EventEmitter<any> = new EventEmitter();
  @Output() resize: EventEmitter<any> = new EventEmitter();

  /** Propagates the event when the [execute context menu item] event is fired */
  @Output() contextMenuExecuted: EventEmitter<any> = new EventEmitter();

  @HostBinding('class.fixed-header')
  get isFixedHeader() {
    const headerHeight: number | string = this.headerHeight;
    return (typeof headerHeight === 'string') ?
      (<string>headerHeight) !== 'auto' : true;
  }

  @HostBinding('class.fixed-row')
  get isFixedRow() {
    const rowHeight: number | string = this.rowHeight;
    return (typeof rowHeight === 'string') ?
      (<string>rowHeight) !== 'auto' : true;
  }

  @HostBinding('class.scroll-vertical')
  get isVertScroll() {
    return this.scrollbarV;
  }

  @HostBinding('class.scroll-horz')
  get isHorScroll() {
    return this.scrollbarH;
  }

  @HostBinding('class.selectable')
  get isSelectable() {
    return this.selectionType !== undefined;
  }

  @ContentChildren(DataTableColumnDirective)
  set columnTemplates(val: QueryList<DataTableColumnDirective>) {
    this._columnTemplates = val;

    if (val) {
      // only set this if results were brought back
      const arr = val.toArray();

      if (arr.length) {
        // translate them to normal objects
        this.columns = translateTemplates(arr);
      }
    }
  }

  get columnTemplates(): QueryList<DataTableColumnDirective> {
    return this._columnTemplates;
  }

  @ContentChild(DatatableRowDetailDirective)
  set rowDetailTemplateChild(val: DatatableRowDetailDirective) {
    this._rowDetailTemplateChild = val;
    if (val) this.rowDetailTemplate = val.rowDetailTemplate;
  }

  get rowDetailTemplateChild(): DatatableRowDetailDirective {
    return this._rowDetailTemplateChild;
  }

  @ContentChild(MenuItemDetailDirective)
  set menuItemDetailTemplateChild(val: MenuItemDetailDirective) {
    this._menuItemDetailTemplateChild = val;
    if (val) this.menuItemDetailTemplate = val.menuItemDetailTemplate;
  }

  get menuItemDetailTemplateChild(): MenuItemDetailDirective {
    return this._menuItemDetailTemplateChild;
  }

  offsetX: number = 0;

  @ViewChild(DataTableBodyComponent)
  private bodyComponent: DataTableBodyComponent;

  private element: HTMLElement;
  private innerWidth: number;
  private pageSize: number;
  private bodyHeight: number;
  private rowCount: number;

  private _rows: any[];
  private _columns: any[];
  private _columnTemplates: QueryList<DataTableColumnDirective>;
  private _rowDetailTemplateChild: DatatableRowDetailDirective;
  private _menuItemDetailTemplateChild: MenuItemDetailDirective;

  private _fromonColumnSort: boolean = false;

  private sortPageRows(rows: any[], dirs: any[], offset: number, limit: number, columns: any[]): any[] {
    let result: any[] = [];
    let rowsToSort: any[] = [];
    let start: number, end: number;

    if (limit > 0) {
      // yes, then perform an 'in-page' sort
      start = offset * limit;
      end = start + limit;
    }

    if (limit > 0) {
      // yes, then perform an 'in-page' sort
      for (let i = start; i < end; i++) {
        rowsToSort.push(rows[i]);
      }
    }
    else {
      // no, then consider the entire result set.
      rowsToSort = rows;
    }

    // perform the actual sorting
    rowsToSort = sortRows(rowsToSort, columns, dirs);

    // re-insertst the 'in-page' sorted rows (if needs to)
    if (limit > 0) {

      let j = 0;
      for (let i = start; i < end; i++) {
        rows[i] = rowsToSort[j]; j++;
      }
    }

    return rows;  
  }

  constructor(renderer: Renderer, element: ElementRef) {
    this.element = element.nativeElement;
    renderer.setElementClass(this.element, 'datatable', true);
  }

  ngOnInit(): void {
    // need to call this immediatly to size
    // if the table is hidden the visibility
    // listener will invoke this itself upon show
    this.recalculate();
  }

  ngAfterViewInit(): void {
    this.recalculate();
  }

  /**
   * Refresh the table rows manually.
   */
  refresh(): void {
    this.bodyComponent.recalcLayout();
  }

  /**
   * Toggle the expansion of the row
   *
   * @param rowIndex
   */
  toggleExpandRow(row: any): void {
    // Should we write a guard here??
    this.bodyComponent.toggleRowExpansion(row);
  }

  /**
   * API method to expand all the rows.
   */
  expandAllRows(): void {
    this.bodyComponent.toggleAllRows(true);
  }

  /**
   * API method to collapse all the rows.
   */
  collapseAllRows(): void {
    this.bodyComponent.toggleAllRows(false);
  }

  @HostListener('window:resize')
  recalculate() {
    this.recalculateDims();
    this.recalculateColumns();
  }

  recalculateColumns(columns: any[] = this.columns, forceIdx?: number): any[] {
    if (!columns) return;

    let width = this.innerWidth;
    if (this.scrollbarV) {
      width = width - scrollbarWidth;
    }

    if (this.columnMode === ColumnMode.force) {
      forceFillColumnWidths(columns, width, forceIdx);
    } else if (this.columnMode === ColumnMode.flex) {
      adjustColumnWidths(columns, width);
    }

    return columns;
  }

  recalculateDims(): void {
    let { height, width } = this.element.getBoundingClientRect();
    this.innerWidth = Math.floor(width);

    if (this.scrollbarV) {
      if (this.headerHeight) height = height - this.headerHeight;
      if (this.footerHeight) height = height - this.footerHeight;
      this.bodyHeight = height;
    }

    this.pageSize = this.calcPageSize();
    this.rowCount = this.calcRowCount();
  }

  onBodyPage({ offset }): void {
    this.offset = offset;

    this.page.emit({
      count: this.count,
      pageSize: this.pageSize,
      limit: this.limit,
      offset: this.offset
    });
  }

  onBodyScroll(event): void {
    this.offsetX = event.offsetX;
    this.scroll.emit(event);
  }

  onFooterPage(event) {
    this.offset = event.page - 1;
    this.bodyComponent.updateOffsetY(this.offset);

    this.page.emit({
      count: this.count,
      pageSize: this.pageSize,
      limit: this.limit,
      offset: this.offset
    });
  }

  calcPageSize(val: any[] = this.rows): number {
    // Keep the page size constant even if the row has been expanded.
    // This is because an expanded row is still considered to be a child of
    // the original row.  Hence calculation would use rowHeight only.
    if (this.scrollbarV) return Math.ceil(this.bodyHeight / this.rowHeight);

    // if limit is passed, we are paging
    if (this.limit !== undefined) return this.limit;

    // otherwise use row length
    if (val) return val.length;

    // other empty :(
    return 0;
  }

  calcRowCount(val: any[] = this.rows): number {
    if (!this.externalPaging) {
      if (!val) return 0;
      return val.length;
    }

    return this.count;
  }

  onColumnResize({ column, newValue }): void {
    let idx;
    let cols = this.columns.map((c, i) => {
      c = Object.assign({}, c);

      if (c.$$id === column.$$id) {
        idx = i;
        c.width = newValue;

        // set this so we can force the column
        // width distribution to be to this value
        c.$$oldWidth = newValue;
      }

      return c;
    });

    this.recalculateColumns(cols, idx);
    this.columns = cols;

    this.resize.emit({
      column,
      newValue
    });
  }

  onColumnReorder({ column, newValue, prevValue }): void {
    let cols = this.columns.map(c => {
      return Object.assign({}, c);
    });

    cols.splice(prevValue, 1);
    cols.splice(newValue, 0, column);
    this.columns = cols;

    this.reorder.emit({
      column,
      newValue,
      prevValue
    });
  }

  onColumnSort(event): void {
    const { sorts } = event;

    // if sorting on server, bypass client 'in-page' sorting.
    if (!this.externalSorting) {
      let allRows = [...this.rows];

      // sort only the rows in the current page but returns entire result set.
      allRows = this.sortPageRows(allRows, sorts, this.offset, this.limit, this.columns);

      // since the rows setter will want to apply default sorting, indicate that the sorting has already taken place.
      this._fromonColumnSort = true;
      this.rows = allRows;
    }

    this.sorts = sorts;
    this.bodyComponent.updateOffsetY(0);
    this.sort.emit(event);
  }
}
