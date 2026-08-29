import { Router } from 'express';
import { CompanyController } from './companies.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';

const companiesRouter = Router();

companiesRouter.use(requireAuth);

companiesRouter.get('/', hasPermission('COMPANY_READ'), CompanyController.getCompanies);
companiesRouter.post('/', hasPermission('COMPANY_CREATE'), CompanyController.createCompany);
companiesRouter.get('/search-location', hasPermission('COMPANY_CREATE'), CompanyController.searchLocations);
companiesRouter.post('/resolve-location', hasPermission('COMPANY_CREATE'), CompanyController.resolveLocation);
companiesRouter.get('/:id', hasPermission('COMPANY_READ'), CompanyController.getCompanyById);
companiesRouter.patch('/:id', hasPermission('COMPANY_UPDATE'), CompanyController.updateCompany);

export default companiesRouter;
