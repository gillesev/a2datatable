import { Directive, TemplateRef, ContentChild } from '@angular/core';

@Directive({
  selector: 'menu-item-detail-template'
})
/** Directive used to provide the menu item detail template reference to a hosting view. */
export class MenuItemDetailDirective {

  @ContentChild(TemplateRef) template: TemplateRef<any>;

  get menuItemDetailTemplate(): TemplateRef<any> {
    return this.template;
  }
}