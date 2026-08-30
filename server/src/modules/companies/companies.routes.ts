import { Router } from 'express';
import multer from 'multer';
import { CompanyController } from './companies.controller';
import { requireAuth, hasPermission } from '../../middleware/auth';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const companiesRouter = Router();

companiesRouter.use(requireAuth);

companiesRouter.get('/', hasPermission('COMPANY_READ'), CompanyController.getCompanies);
companiesRouter.post('/', hasPermission('COMPANY_CREATE'), CompanyController.createCompany);
companiesRouter.post('/import', hasPermission('COMPANY_CREATE'), upload.single('file'), CompanyController.importCompanies);
companiesRouter.get('/search-location', hasPermission('COMPANY_CREATE'), CompanyController.searchLocations);
companiesRouter.post('/resolve-location', hasPermission('COMPANY_CREATE'), CompanyController.resolveLocation);
companiesRouter.get('/industries', hasPermission('COMPANY_READ'), CompanyController.getIndustries);
companiesRouter.get('/:id', hasPermission('COMPANY_READ'), CompanyController.getCompanyById);
companiesRouter.patch('/:id', hasPermission('COMPANY_UPDATE'), CompanyController.updateCompany);
companiesRouter.delete('/:id', hasPermission('COMPANY_DELETE'), CompanyController.deleteCompany);

export default companiesRouter;

