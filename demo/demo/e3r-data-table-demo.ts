import { Component, Inject, Input } from '@angular/core';

import { 
  ContextMenuComponent,
  ContextMenuService,
  DataTableContextMenuConfig, 
  ContextMenuItemDescriptor
} from '../../src';

/** Create an instance of DataTableContextMenuConfig to build an array of the item menu descriptors
 * specific to this data table.
 * Note: the use of the providers with [useValue] to NOT share this config service across components.
 */
const dataTableCtxtMenuConfigDemo: DataTableContextMenuConfig = new DataTableContextMenuConfig(
    [
      { 
        id: 1, 
        order: 1, 
        description: 'View' 
      },
      { 
        id: 2, 
        order: 2, 
        description: 'Edit'
      },
      { 
        id: 3, 
        order: 3, 
        description: 'Delete' 
      }
    ]
);

/** E3RDataComponent demo
 * Note: the demo does not use ALL the configuration options available. Please consult documentation.
 * 
 * about columns:
 * [columns] is a list of DataTableColumnDirective:
 * name;
 * prop;
 * frozenLeft;
 * frozenRight;
 * flexGrow;
 * resizeable;
 * comparator;
 * pipe;
 * sortable;
 * draggable;
 * canAutoResize;
 * minWidth;
 * width;
 * maxWidth;
 * 
 * about selection:
 * [selectionType]: single|multiple so property selected will be an array
 * 
 * about paging:
 * [externalPaging]: set to true to implement server side paging.
 * [count]: total count
 * [offset]: current page offset
 * [limit]: page limit
 * (page): provide a handler for when pager fires a page change event.
 * (activate): provide a handler for when data table component bubbles up an event.
 * 
 * about context menu:
 * [useContextMenu]: set to true if want to use context menu feature.
 * [contextMenuVisible]: provide a (dataItem: any, menuDef: ContextMenuItemDescriptor) => boolean function
 *  to determine if a menu item is visible.
 * [contextMenuEnabled]: provide a (dataItem: any, menuDef: ContextMenuItemDescriptor) => boolean function
 *  to determine if a menu item is enabled.
 * (contextMenuExecuted): provide a handler for when a menu item is selected.
 * <menu-item-detail-template>: provide a menu item detail template. 
 *  This feature is provided using the ngTemplateOutlet experimental directive.
 *  The context which is surfaced to the template is an object with shape: { context: { dataItem: any, menuDesc: ContextMenuItemDescriptor }}.
 *  The context gives you access to a) data item is the data item row targeted by the right click and 
 *  b) the menu descriptor. 
 */ 
@Component({
  selector: 'e3r-data-table-demo',
  template: `
    <div>
      <h3>@e3r Data Table Component Demo</h3>
      <h3>documentation: https://github.com/swimlane/angular2-data-table#README</h3>
      <e3r-data-table
        class="material"
        [rows]="rows"
        [columns]="[{name:'Name', resizeable: false},{name:'Gender', resizeable: false},{name:'Company', resizeable: false}]"
        [columnMode]=""
        [headerHeight]="40"
        [footerHeight]="90"
        [rowHeight]="40"
        [externalPaging]="true"
        [count]="count"
        [offset]="offset"
        [limit]="limit"
        [selected]="selected"
        [selectionType]="'single'"        
        (page)='onPage($event)'
        (activate)='onActivate($event)'
        [useContextMenu]="true"
        [contextMenuVisible]='isContextMenuItemVisible'
        [contextMenuEnabled]='isContextMenuItemEnabled'
        (contextMenuExecuted)='onExecuteMenuItem($event.dataItem, $event.ctxtMenuDef)'>

        <menu-item-detail-template>
          <template let-context="context">
            {{ context.menuDesc.description }} ({{ context.dataItem.name }})
          </template>
        </menu-item-detail-template>

      </e3r-data-table>
    </div>
  `,
  providers: [ 
    ContextMenuService,
    { provide: DataTableContextMenuConfig, useValue: dataTableCtxtMenuConfigDemo} 
  ]
})
export class DataComponentDemo {

  rows = [];
  count: number = 0;
  offset: number = 0;
  limit: number = 10;
  selected = [];

  /** Add logic here to initialize the data component (not in the ctor). */
  ngOnInit() {
    this.page(this.offset, this.limit);
  }

  /** DEMO method to populate a data table page with data.
   * This method illustrates how server paging can be implemented.
   */
  page(offset, limit) {
    this.fetch((results) => {
      this.count = results.length;

      const start = offset * limit;
      const end = start + limit;
      let rows = [...this.rows];

      for (let i = start; i < end; i++) {
        rows[i] = results[i];
      }

      this.rows = rows;
    });
  }

  /** DEMO method to fetch data. Observable api should be used. */
  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/company.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }

  /** Add logic here to describe what happens when pager fires page change event. */
  onPage(event) {
    this.page(event.offset, event.limit);
  }

  /** Add logic here to describe what happens then an event is bubbled up by the data table component. */
  onActivate(event) {
  }

  /** Add logic here to determine if context menu is visible. */
  isContextMenuItemVisible = (dataItem: any, menuDef: ContextMenuItemDescriptor) => {
    return true;
  }

  /** Add logic here to determine if context menu is enabled. */
  isContextMenuItemEnabled = (dataItem: any, menuDef: ContextMenuItemDescriptor) => {
    return true;
  }
  
  /** Add logic here to describe what happens when context menu is selected. */
  onExecuteMenuItem = (dataItem: any, menuDef: ContextMenuItemDescriptor) => {
  }

  /** 
   * - ContextMenuService is used to provide menu context feature
   * - DataTableContextMenuConfig is used to inject the menu item descriptors (e.g. 'View', 'Edit' options.)
   * - see ContextMenuItemDescriptor model
   */
  constructor(private contextMenuService: ContextMenuService, private _ctxtMenuItemConfig: DataTableContextMenuConfig) {
  }
}