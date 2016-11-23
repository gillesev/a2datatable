import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class SearchServiceDemo {
  constructor(private http: Http) { }

  search(offset: number, limit: number): Observable<any[]> {
    return this.http
      .get(`app/companies/`)
      .map((r: Response) => r.json().data)
      .catch((error: any) => Observable.throw(error.json().error || 'Server error'));
  }
}
