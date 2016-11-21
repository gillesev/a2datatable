import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import {
  DatatableComponent,
  DataTableColumnDirective,
  DataTableHeaderComponent,
  DataTableBodyComponent,
  DataTableFooterComponent,
  DataTableHeaderCellComponent,
  DataTableBodyRowComponent,
  DataTableRowWrapperComponent,
  ProgressBarComponent,
  DataTableBodyCellComponent,
  DatatableRowDetailDirective,
  MenuItemDetailDirective,
  ScrollerComponent,
  DataTableSelectionComponent,
  ContextMenuComponent
} from './components';

import {
  VisibilityDirective,
  LongPressDirective,
  ResizeableDirective,
  OrderableDirective,
  DraggableDirective,
  ContextMenuAttachDirective,
  ContextMenuItemDirective
} from './directives';

import {
  CONTEXT_MENU_OPTIONS,
  IContextMenuOptions
} from './services';

@NgModule({
  imports: [
    CommonModule,
    NgbPaginationModule
  ],
  declarations: [
    VisibilityDirective,
    DraggableDirective,
    ResizeableDirective,
    OrderableDirective,
    LongPressDirective,
    ScrollerComponent,
    DatatableComponent,
    DataTableColumnDirective,
    DataTableHeaderComponent,
    DataTableHeaderCellComponent,
    DataTableBodyComponent,
    DataTableFooterComponent,
    ProgressBarComponent,
    DataTableBodyRowComponent,
    DataTableRowWrapperComponent,
    DatatableRowDetailDirective,
    DataTableBodyCellComponent,
    DataTableSelectionComponent,
    ContextMenuAttachDirective,
    ContextMenuComponent,
    ContextMenuItemDirective, 
    MenuItemDetailDirective   
  ],
  exports: [
    DatatableComponent,
    DatatableRowDetailDirective,
    DataTableColumnDirective,
    ContextMenuAttachDirective,
    ContextMenuComponent,
    ContextMenuItemDirective,
    MenuItemDetailDirective    
  ]
})
/** Feature module for the e3r data table component. */
export class E3RDataTableModule {

  /** can be called from the application root module (provides a singleton). */
  public static forRoot(options: IContextMenuOptions): ModuleWithProviders {
    return {
      ngModule: E3RDataTableModule,
      providers: [
        {
          provide: CONTEXT_MENU_OPTIONS,
          useValue: options,
        },
      ]
    };
  }
}
