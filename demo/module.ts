import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { removeNgStyles, createNewHosts } from '@angularclass/hmr';
import { E3RDataTableModule,  } from '../src';
import { AppComponent } from './app.component';
import '../src/components/datatable.scss';
import '../src/themes/material.scss';

// -- Demo
import { DataComponentDemo } from './demo/e3r-data-table-demo';

/** 
 * Import the E3RDataTableModule singleton.
*/
@NgModule({
  imports: [
    BrowserModule,
    E3RDataTableModule.forRoot({
      useBootstrap4: true,	
    })
  ],
  declarations: [
    AppComponent,
    DataComponentDemo
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(private appRef: ApplicationRef) { 
  }

  hmrOnDestroy(store) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    store.disposeOldHosts = createNewHosts(cmpLocation);
    removeNgStyles();
  }

  hmrAfterDestroy(store) {
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }
}
